import express from 'express'
import bcrypt  from 'bcrypt'
import jwt     from 'jsonwebtoken'
import db      from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { broadcastAdmin } from '../events.js'

const router = express.Router()

// REGISTER
router.post('/register', async (req, res) => {
    const { fullName, email, phone, homeCity, password } = req.body
    try {
        const hash     = await bcrypt.hash(password, 10)
        const initials = fullName.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('')
        const [rows]   = await db.query('SELECT COUNT(*) as count FROM users')
        const role     = rows[0].count === 0 ? 'admin' : 'traveler'

        await db.query(
            `INSERT INTO users (full_name, email, password, phone, home_city, initials, role)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fullName.trim(), email.trim().toLowerCase(), hash, phone || '', homeCity || '', initials, role]
        )
        await db.query(
            `INSERT INTO activity_logs (user_email, action, detail, ip_address)
             VALUES (?, 'register', ?, ?)`,
            [email, `New ${role} registered`, req.ip]
        )
        broadcastAdmin('user_registered', {
            fullName: fullName.trim(),
            email:    email.trim().toLowerCase(),
            role,
        })
        res.json({ message: 'Registered successfully' })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(400).json({ error: 'Email already registered' })
        res.status(500).json({ error: err.message })
    }
})

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()])
        const user   = rows[0]

        if (!user)                                           return res.status(400).json({ error: 'User not found' })
        if (user.is_locked)                                  return res.status(403).json({ error: 'Account is locked' })
        if (!await bcrypt.compare(password, user.password)) return res.status(400).json({ error: 'Wrong password' })

        await db.query('UPDATE users SET last_login_at = NOW(), is_online = TRUE WHERE id = ?', [user.id])
        await db.query(
            `INSERT INTO activity_logs (user_id, user_email, action, detail, ip_address)
             VALUES (?, ?, 'login', 'Logged in', ?)`,
            [user.id, user.email, req.ip]
        )

        broadcastAdmin('user_login', {
            id:       user.id,
            fullName: user.full_name,
            email:    user.email,
        })

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )
        res.json({
            token,
            user: {
                id:       user.id,
                fullName: user.full_name,
                email:    user.email,
                role:     user.role,
                phone:    user.phone,
                homeCity: user.home_city,
                initials: user.initials,
            }
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// LOGOUT
router.post('/logout', requireAuth, async (req, res) => {
    try {
        await db.query('UPDATE users SET is_online = FALSE WHERE id = ?', [req.user.userId])
        await db.query(
            `INSERT INTO activity_logs (user_id, user_email, action, detail, ip_address)
             VALUES (?, ?, 'logout', 'Logged out', ?)`,
            [req.user.userId, req.user.email, req.ip]
        )
        res.json({ message: 'Logged out' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET CURRENT USER (from token)
router.get('/me', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, full_name, email, phone, home_city, initials, role, is_locked, is_online, created_at, last_login_at
             FROM users WHERE id = ?`,
            [req.user.userId]
        )
        const u = rows[0]
        if (!u) return res.status(404).json({ error: 'User not found' })
        res.json({
            id:       u.id,
            fullName: u.full_name,
            email:    u.email,
            role:     u.role,
            phone:    u.phone,
            homeCity: u.home_city,
            initials: u.initials,
            isLocked: Boolean(u.is_locked),
            isOnline: Boolean(u.is_online),
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// CHANGE PASSWORD
router.post('/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.userId])
        const user   = rows[0]
        if (!user) return res.status(404).json({ error: 'User not found' })
        if (!await bcrypt.compare(currentPassword, user.password))
            return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' })
        const hash = await bcrypt.hash(newPassword, 10)
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.userId])
        res.json({ message: 'Password changed' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// RESET PASSWORD (send email — stub, requires nodemailer setup)
router.post('/reset-password', async (req, res) => {
    const { email } = req.body
    try {
        const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email?.trim().toLowerCase()])
        if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' })
        // TODO: integrate nodemailer to send actual reset email
        res.json({ message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
