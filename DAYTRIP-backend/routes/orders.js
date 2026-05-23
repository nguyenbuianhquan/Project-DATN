import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import db      from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js'

const router = express.Router()

// ── POST / — Tạo đơn hàng mới ────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
    const {
        location, title, itemName,
        total = 0, subTotal = 0, tax = 0,
        date, checkOut,
        paymentMethod, paymentTab,
        serviceId, notes, items,
    } = req.body

    const orderId  = uuidv4()
    const label    = location || itemName || title || 'Dịch vụ'
    const method   = paymentTab === 'online' ? paymentMethod : (paymentMethod || 'card')

    try {
        await db.query(
            `INSERT INTO orders
               (id, user_id, service_id, item_name,
                total_price, sub_total, tax,
                check_in_date, check_out_date,
                payment_method, location, notes,
                status, order_data)
             VALUES (?,?,?,?, ?,?,?, ?,?, ?,?,?, 'pending', ?)`,
            [
                orderId, req.user.userId, serviceId || null, label,
                total, subTotal, tax,
                date   || null,
                checkOut || null,
                method, location || null, notes || null,
                JSON.stringify(req.body),
            ]
        )

        // Tạo bản ghi payment tương ứng
        await db.query(
            `INSERT INTO payments (id, order_id, user_id, amount, method, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [uuidv4(), orderId, req.user.userId, total, method]
        )

        await db.query(
            `INSERT INTO activity_logs (user_id, user_email, action, detail, ip_address)
             VALUES (?, ?, 'purchase', ?, ?)`,
            [req.user.userId, req.user.email, `Booked: ${label}`, req.ip]
        )

        res.json({ message: 'Order placed', orderId })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── GET /all — Toàn bộ đơn hàng (admin) ─────────────────────────
router.get('/all', requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT
                o.id, o.status, o.created_at, o.updated_at,
                o.item_name, o.location,
                o.total_price  AS total,
                o.sub_total    AS subTotal,
                o.tax,
                o.check_in_date  AS date,
                o.check_out_date AS checkOut,
                o.payment_method AS paymentMethod,
                o.notes,
                o.order_data,
                u.full_name, u.email,
                p.status       AS paymentStatus,
                p.transaction_id
             FROM orders o
             LEFT JOIN users    u ON o.user_id   = u.id
             LEFT JOIN payments p ON p.order_id  = o.id
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
                o.id, o.status, o.created_at,
                o.item_name, o.location,
                o.total_price  AS total,
                o.sub_total    AS subTotal,
                o.tax,
                o.check_in_date  AS date,
                o.check_out_date AS checkOut,
                o.payment_method AS paymentMethod,
                o.order_data,
                p.status AS paymentStatus
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

// ── PATCH /:id/status — Cập nhật trạng thái đơn (admin) ──────────
router.patch('/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body
    try {
        await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, req.params.id]
        )
        // Đồng bộ trạng thái payment nếu đơn hoàn tất / hủy
        if (status === 'completed') {
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

export default router
