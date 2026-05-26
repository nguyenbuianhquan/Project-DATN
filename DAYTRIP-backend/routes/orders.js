import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import db      from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js'

const router = express.Router()

// ── POST / — Tạo đơn hàng mới ────────────────────────────────────
// Lớp bảo vệ thứ 2 chống đặt trùng: verify reservationId + transaction
router.post('/', requireAuth, async (req, res) => {
    const {
        // thông tin dịch vụ
        location, title, itemName, serviceId, items,

        // giá
        total    = 0,
        subTotal = 0,
        tax      = 0,
        discount = 0,

        // ngày
        date,
        checkOut,

        // thanh toán (mới)
        paymentMethod,          // "card" | "momo" | "vnpay" | "pay_at_property"
        paymentTab,             // payMode: "online" | "at_property" | "deposit"

        // coupon
        coupon,                 // label của coupon (vd: "Giảm 10%")
        couponCode,             // mã coupon (vd: "DAYTRIP10")

        // booking ref (frontend tự sinh)
        bookingId,

        // giữ chỗ — từ /api/rooms/reserve (chống đặt trùng)
        reservationId,

        // thông tin khách hàng
        userName,
        userEmail,
        phone,
        notes,
        specialRequest,
    } = req.body

    const orderId   = uuidv4()
    const itemLabel = location || itemName || title || 'Dịch vụ'
    const payMode   = paymentTab || 'online'

    // Xác định phương thức thanh toán lưu vào DB
    const method    = (payMode === 'online' || payMode === 'deposit')
        ? (paymentMethod || 'card')
        : 'pay_at_property'

    // Số tiền tạo payment record: deposit = 30%, at_property = 0, online = full
    const payAmount = payMode === 'deposit'    ? Math.round(total * 0.3)
                    : payMode === 'at_property' ? 0
                    : Math.round(total - discount)

    // Payment status ban đầu ('pending' cho tất cả — kể cả at_property)
    const payStatus = 'pending'

    // Dùng connection riêng để có thể dùng TRANSACTION
    const conn = await db.getConnection()
    try {
        await conn.beginTransaction()

        // ── Lớp bảo vệ 2: Kiểm tra reservationId còn hợp lệ không ──────
        // (Lớp bảo vệ 1 đã xảy ra ở /api/rooms/reserve khi user click chọn phòng)
        if (reservationId) {
            const [reservations] = await conn.query(
                `SELECT id, status, expires_at
                 FROM room_reservations
                 WHERE id = ? AND user_id = ? AND status = 'holding' AND expires_at > NOW()
                 FOR UPDATE`,   // Lock row để tránh race condition lúc checkout
                [reservationId, req.user.userId]
            )

            if (reservations.length === 0) {
                await conn.rollback()
                return res.status(409).json({
                    error: 'Phiên giữ chỗ đã hết hạn hoặc không hợp lệ. Vui lòng quay lại chọn phòng.',
                    code:  'RESERVATION_EXPIRED',
                })
            }
        }

        // ── 1. Insert đơn hàng ──────────────────────────────────────────
        // Lưu ý: service_id được lưu dạng text (không có FK tới bảng services)
        await conn.query(
            `INSERT INTO orders
               (id, booking_ref, user_id, item_name,
                total_price, sub_total, tax, discount,
                check_in_date, check_out_date,
                payment_method, pay_mode,
                location, notes, phone, special_req,
                coupon_code,
                status, order_data)
             VALUES (?,?,?,?, ?,?,?,?, ?,?, ?,?, ?,?,?,?, ?, 'pending', ?)`,
            [
                orderId,
                bookingId || null,
                req.user.userId,
                itemLabel,

                Math.round(total),
                Math.round(subTotal),
                Math.round(tax),
                Math.round(discount),

                date     || null,
                checkOut || null,

                method,
                payMode,

                location     || null,
                notes        || null,
                phone        || null,
                specialRequest || null,

                couponCode || null,

                JSON.stringify(req.body),
            ]
        )

        // ── 2. Xác nhận reservation → 'confirmed' (phòng đã có chủ) ────
        if (reservationId) {
            await conn.query(
                `UPDATE room_reservations SET status = 'confirmed' WHERE id = ?`,
                [reservationId]
            )
        }

        // ── 3. Tăng used_count nếu dùng coupon ──────────────────────────
        if (couponCode) {
            await conn.query(
                'UPDATE coupons SET used_count = used_count + 1 WHERE code = ?',
                [couponCode.toUpperCase()]
            )
        }

        // ── 4. Tạo bản ghi payment ──────────────────────────────────────
        await conn.query(
            `INSERT INTO payments (id, order_id, user_id, amount, method, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), orderId, req.user.userId, payAmount, method, payStatus]
        )

        // ── 5. Ghi log hoạt động ────────────────────────────────────────
        await conn.query(
            `INSERT INTO activity_logs (user_id, user_email, action, detail, ip_address)
             VALUES (?, ?, 'purchase', ?, ?)`,
            [
                req.user.userId,
                req.user.email,
                `Booked: ${itemLabel} | Mode: ${payMode} | Amount: ${payAmount}`,
                req.ip,
            ]
        )

        // ── Commit tất cả trong 1 transaction ───────────────────────────
        await conn.commit()

        res.status(201).json({
            message:   'Order placed',
            orderId,
            bookingRef: bookingId || orderId,
        })

    } catch (err) {
        await conn.rollback()
        console.error('[orders POST]', err)
        res.status(500).json({ error: err.message })
    } finally {
        conn.release()
    }
})

// ── GET /all — Toàn bộ đơn hàng (admin) ─────────────────────────
router.get('/all', requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT
                o.id,
                o.booking_ref    AS bookingRef,
                o.status,
                o.created_at,
                o.updated_at,
                o.item_name,
                o.location,
                o.total_price    AS total,
                o.sub_total      AS subTotal,
                o.tax,
                o.discount,
                o.coupon_code    AS couponCode,
                o.check_in_date  AS date,
                o.check_out_date AS checkOut,
                o.payment_method AS paymentMethod,
                o.pay_mode       AS payMode,
                o.notes,
                o.phone,
                o.special_req    AS specialRequest,
                o.order_data,
                u.full_name,
                u.email,
                p.status         AS paymentStatus,
                p.transaction_id,
                p.amount         AS paymentAmount
             FROM orders o
             LEFT JOIN users    u ON o.user_id  = u.id
             LEFT JOIN payments p ON p.order_id = o.id
             ORDER BY o.created_at DESC`
        )
        res.json(orders)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── GET /mine — Đơn hàng của user đang đăng nhập ─────────────────
router.get('/mine', requireAuth, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT
                o.id,
                o.booking_ref    AS bookingRef,
                o.status,
                o.created_at,
                o.item_name,
                o.location,
                o.total_price    AS total,
                o.sub_total      AS subTotal,
                o.tax,
                o.discount,
                o.coupon_code    AS couponCode,
                o.check_in_date  AS date,
                o.check_out_date AS checkOut,
                o.payment_method AS paymentMethod,
                o.pay_mode       AS payMode,
                o.notes,
                o.phone,
                o.order_data,
                p.status         AS paymentStatus,
                p.amount         AS paymentAmount
             FROM orders o
             LEFT JOIN payments p ON p.order_id = o.id
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC`,
            [req.user.userId]
        )
        res.json(orders)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── GET /:id — Chi tiết 1 đơn ─────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT o.*, p.status AS paymentStatus, p.amount AS paymentAmount,
                    u.full_name, u.email AS userEmail
             FROM orders o
             LEFT JOIN payments p ON p.order_id = o.id
             LEFT JOIN users    u ON o.user_id  = u.id
             WHERE o.id = ? OR o.booking_ref = ?`,
            [req.params.id, req.params.id]
        )
        if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })

        // Chỉ admin hoặc chủ đơn mới xem được
        if (req.user.role !== 'admin' && rows[0].user_id !== req.user.userId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' })
        }
        res.json(rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── PATCH /:id/status — Cập nhật trạng thái (admin) ──────────────
router.patch('/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body
    const allowed = ['pending', 'confirmed', 'cancelled', 'completed']
    if (!allowed.includes(status))
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' })

    try {
        await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        )

        if (status === 'confirmed' || status === 'completed') {
            await db.query(
                `UPDATE payments SET status = 'paid', paid_at = NOW() WHERE order_id = ?`,
                [req.params.id]
            )
        } else if (status === 'cancelled') {
            await db.query(
                `UPDATE payments SET status = 'refunded' WHERE order_id = ?`,
                [req.params.id]
            )
        }

        res.json({ message: 'Status updated' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── PATCH /:id/cancel — User tự hủy đơn ─────────────────────────
router.patch('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const [[order]] = await db.query(
            'SELECT user_id, status FROM orders WHERE id = ?',
            [req.params.id]
        )
        if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })
        if (order.user_id !== req.user.userId && req.user.role !== 'admin')
            return res.status(403).json({ error: 'Không có quyền' })
        if (order.status === 'cancelled')
            return res.status(400).json({ error: 'Đơn đã bị hủy trước đó' })

        await db.query(
            "UPDATE orders   SET status = 'cancelled' WHERE id = ?", [req.params.id]
        )
        await db.query(
            "UPDATE payments SET status = 'refunded'  WHERE order_id = ?", [req.params.id]
        )
        res.json({ message: 'Đơn hàng đã được hủy' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
