import jwt from 'jsonwebtoken'

export const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Not authenticated' })
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET)
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}

export const requireAdmin = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin')
            return res.status(403).json({ error: 'Admin only' })
        next()
    })
}

// SSE variant: also accepts token from query string (EventSource can't set headers)
export const requireAdminSSE = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token
    if (!token) return res.status(401).json({ error: 'Not authenticated' })
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET)
        if (req.user.role !== 'admin')
            return res.status(403).json({ error: 'Admin only' })
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
