import express from 'express'
import db      from '../db.js'

const router = express.Router()

// ── POST /apply — Kiểm tra và áp dụng mã giảm giá ────────────────
router.post('/apply', async (req, res) => {
    const { code, totalPrice = 0 } = req.body

    if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá' })
    }

    try {
        const [[coupon]] = await db.query(
            `SELECT * FROM coupons
             WHERE code = ?
               AND is_active = 1
               AND (expires_at IS NULL OR expires_at > NOW())
               AND (max_uses IS NULL OR used_count < max_uses)`,
            [code.trim().toUpperCase()]
        )

        if (!coupon) {
            return res.status(404).json({ error: 'Mã không hợp lệ hoặc đã hết hạn' })
        }

        // Tính số tiền được giảm
        const discount = coupon.type === 'percent'
            ? Math.round(totalPrice * coupon.value / 100)
            : Math.round(coupon.value)

        const finalDiscount = Math.min(discount, totalPrice) // không giảm quá tổng tiền

        const label = coupon.type === 'percent'
            ? `Giảm ${coupon.value}% tổng đơn`
            : `Giảm ${Number(coupon.value).toLocaleString('vi-VN')} ₫`

        res.json({
            code:       coupon.code,
            label,
            discount:   finalDiscount,
            type:       coupon.type,
            value:      coupon.value,
        })

    } catch (err) {
        console.error('[coupons /apply]', err)
        res.status(500).json({ error: err.message })
    }
})

// ── GET / — Danh sách coupon (admin) ──────────────────────────────
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM coupons ORDER BY created_at DESC'
        )
        res.json(rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── POST / — Thêm coupon mới (admin) ─────────────────────────────
router.post('/', async (req, res) => {
    const { code, type, value, maxUses, expiresAt } = req.body
    try {
        await db.query(
            `INSERT INTO coupons (code, type, value, max_uses, expires_at)
             VALUES (?, ?, ?, ?, ?)`,
            [
                code.trim().toUpperCase(),
                type,
                value,
                maxUses || 100,
                expiresAt || null,
            ]
        )
        res.status(201).json({ message: 'Đã tạo coupon' })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(400).json({ error: 'Mã coupon đã tồn tại' })
        res.status(500).json({ error: err.message })
    }
})

// ── PATCH /:id — Bật/tắt coupon (admin) ──────────────────────────
router.patch('/:id', async (req, res) => {
    const { isActive } = req.body
    try {
        await db.query(
            'UPDATE coupons SET is_active = ? WHERE id = ?',
            [isActive ? 1 : 0, req.params.id]
        )
        res.json({ message: 'Đã cập nhật' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
