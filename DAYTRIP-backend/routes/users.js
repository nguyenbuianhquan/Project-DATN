import express from 'express'
import db      from '../db.js'
import { requireAuth, requireAdmin, requireAdminSSE } from '../middleware/requireAuth.js'
import { addAdminClient, removeAdminClient } from '../events.js'

const router = express.Router()

// SSE stream — admin subscribes here to receive real-time push events
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

// GET all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, full_name, email, phone, home_city, initials, role,
                    is_locked, is_online, created_at, updated_at, last_login_at
             FROM users ORDER BY created_at DESC`
        )
        res.json(users)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET activity logs (admin only)
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

// UPDATE own profile — returns updated user
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

// UPDATE online status
router.patch('/:id/online', requireAuth, async (req, res) => {
    try {
        await db.query('UPDATE users SET is_online = ? WHERE id = ?', [req.body.isOnline ? 1 : 0, req.params.id])
        res.json({ message: 'Updated' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// LOCK / UNLOCK user (admin only)
router.patch('/:id/lock', requireAdmin, async (req, res) => {
    try {
        await db.query('UPDATE users SET is_locked = ? WHERE id = ?', [req.body.isLocked ? 1 : 0, req.params.id])
        res.json({ message: 'Updated' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// CHANGE role (admin only)
router.patch('/:id/role', requireAdmin, async (req, res) => {
    try {
        await db.query('UPDATE users SET role = ? WHERE id = ?', [req.body.role, req.params.id])
        res.json({ message: 'Role updated' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// DELETE user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id])
        res.json({ message: 'User deleted' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
