import express from 'express'
import db      from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js'

const router = express.Router()

// ── GET /order/:orderId — Lấy payment của 1 đơn hàng ─────────────
router.get('/order/:orderId', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT p.*, o.user_id
             FROM payments p
             JOIN orders o ON p.order_id = o.id
             WHERE p.order_id = ?`,
            [req.params.orderId]
        )
        if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy thanh toán' })

        // Chỉ admin hoặc chính chủ mới được xem
        if (req.user.role !== 'admin' && rows[0].user_id !== req.user.userId) {
            return res.status(403).json({ error: 'Không có quyền truy cập' })
        }
        res.json(rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── PATCH /:id/confirm — Xác nhận thanh toán thành công ──────────
// Dùng khi tích hợp webhook từ Stripe / VNPay / PayOS
router.patch('/:id/confirm', requireAdmin, async (req, res) => {
    const { transactionId, gatewayResponse } = req.body
    try {
        await db.query(
            `UPDATE payments
             SET status = 'paid', transaction_id = ?, gateway_response = ?, paid_at = NOW()
             WHERE id = ?`,
            [transactionId || null, JSON.stringify(gatewayResponse || {}), req.params.id]
        )
        // Đồng bộ trạng thái đơn hàng
        await db.query(
            `UPDATE orders o
             JOIN payments p ON p.order_id = o.id
             SET o.status = 'confirmed'
             WHERE p.id = ?`,
            [req.params.id]
        )
        res.json({ message: 'Payment confirmed' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── GET /all — Tất cả payments (admin) ───────────────────────────
router.get('/all', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT p.*, u.full_name, u.email, o.item_name, o.location
             FROM payments p
             LEFT JOIN users  u ON p.user_id  = u.id
             LEFT JOIN orders o ON p.order_id = o.id
             ORDER BY p.created_at DESC`
        )
        res.json(rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
