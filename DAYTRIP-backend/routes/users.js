import express from 'express'
import db      from '../db.js'
import { requireAuth, requireAdmin, requireAdminSSE } from '../middleware/requireAuth.js'
import { addAdminClient, removeAdminClient } from '../events.js'

const router = express.Router()

// ── SSE stream ────────────────────────────────────────────────────
router.get('/events', requireAdminSSE, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    res.write(`event: connected\ndata: {"ok":true}\n\n`)
    addAdminClient(res)

    const heartbeat = setInterval(() => {
        try { res.write(': ping\n\n') } catch { removeAdminClient(res); clearInterval(heartbeat) }
    }, 25000)

    req.on('close', () => {
        removeAdminClient(res)
        clearInterval(heartbeat)
    })
})

// ── GET / — Danh sách user (admin) ───────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, full_name, email, phone, home_city, initials, role,
                    is_locked, is_online, created_at, updated_at, last_login_at, deleted_at
             FROM users
             WHERE deleted_at IS NULL
             ORDER BY created_at DESC`
        )
        res.json(users)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── GET /logs — Activity logs (admin) ────────────────────────────
router.get('/logs', requireAdmin, async (req, res) => {
    try {
        const [logs] = await db.query(
            'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200'
        )
        res.json(logs)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── GET /:id — Chi tiết 1 user (admin) ───────────────────────────
router.get('/:id', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, full_name, email, phone, home_city, initials, role,
                    is_locked, is_online, created_at, updated_at, last_login_at, deleted_at
             FROM users WHERE id = ?`,
            [req.params.id]
        )
        if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy người dùng' })
        res.json(rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── GET /:id/orders — Lịch sử đặt dịch vụ của user (admin) ──────
router.get('/:id/orders', requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.id, o.booking_ref    AS bookingRef,
                    o.status, o.created_at,
                    o.item_name            AS itemName,
                    o.location,
                    o.total_price          AS total,
                    o.sub_total            AS subTotal,
                    o.tax,
                    o.discount,
                    o.coupon_code          AS couponCode,
                    o.payment_method       AS paymentMethod,
                    o.pay_mode             AS payMode,
                    o.check_in_date        AS date,
                    o.check_out_date       AS checkOut,
                    o.notes,
                    p.status               AS paymentStatus,
                    p.amount               AS paymentAmount
             FROM orders o
             LEFT JOIN payments p ON p.order_id = o.id
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC`,
            [req.params.id]
        )
        res.json(orders)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── PATCH /:id — Cập nhật profile (chính mình) ───────────────────
router.patch('/:id', requireAuth, async (req, res) => {
    const { fullName, phone, homeCity } = req.body
    try {
        const initials = fullName?.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('') || ''
        await db.query(
            'UPDATE users SET full_name = ?, phone = ?, home_city = ?, initials = ? WHERE id = ?',
            [fullName, phone, homeCity, initials, req.params.id]
        )
        const [rows] = await db.query(
            `SELECT id, full_name, email, phone, home_city, initials, role,
                    is_locked, is_online, created_at, last_login_at
             FROM users WHERE id = ?`,
            [req.params.id]
        )
        const u = rows[0]
        res.json({
            id:          u.id,
            fullName:    u.full_name,
            email:       u.email,
            phone:       u.phone,
            homeCity:    u.home_city,
            initials:    u.initials,
            role:        u.role,
            isLocked:    Boolean(u.is_locked),
            isOnline:    Boolean(u.is_online),
            createdAt:   u.created_at,
            lastLoginAt: u.last_login_at,
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── PATCH /:id/admin-edit — Admin chỉnh sửa bất kỳ user ─────────
router.patch('/:id/admin-edit', requireAdmin, async (req, res) => {
    const { fullName, phone, homeCity } = req.body
    try {
        const initials = (fullName || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
        await db.query(
            'UPDATE users SET full_name = ?, phone = ?, home_city = ?, initials = ? WHERE id = ?',
            [fullName || '', phone || '', homeCity || '', initials, req.params.id]
        )
        res.json({ message: 'Updated' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── PATCH /:id/online — Cập nhật trạng thái online ───────────────
router.patch('/:id/online', requireAuth, async (req, res) => {
    try {
        await db.query('UPDATE users SET is_online = ? WHERE id = ?', [req.body.isOnline ? 1 : 0, req.params.id])
        res.json({ message: 'Updated' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── PATCH /:id/lock — Khóa / mở khóa (admin) ─────────────────────
router.patch('/:id/lock', requireAdmin, async (req, res) => {
    try {
        await db.query('UPDATE users SET is_locked = ? WHERE id = ?', [req.body.isLocked ? 1 : 0, req.params.id])
        res.json({ message: 'Updated' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── PATCH /:id/role — Đổi vai trò (admin) ────────────────────────
router.patch('/:id/role', requireAdmin, async (req, res) => {
    try {
        await db.query('UPDATE users SET role = ? WHERE id = ?', [req.body.role, req.params.id])
        res.json({ message: 'Role updated' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── DELETE /:id — Soft delete (admin) ────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await db.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [req.params.id])
        res.json({ message: 'User deleted' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
