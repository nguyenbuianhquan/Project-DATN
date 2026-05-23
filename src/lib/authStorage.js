import { api } from './api.js'

export const AUTH_DB_NAME    = 'MySQL (daytrip_db)'
export const USER_STORE_NAME = 'users'
export const AUTH_SESSION_KEY = 'daytrip-token'

export const firebaseErrorMessage = (err) => err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'

// Map MySQL snake_case row → camelCase user object
const mapUser = (u) => ({
    id:          u.id,
    fullName:    u.full_name    ?? u.fullName    ?? '',
    email:       u.email        ?? '',
    phone:       u.phone        ?? '',
    homeCity:    u.home_city    ?? u.homeCity    ?? '',
    initials:    u.initials     ?? '',
    role:        u.role         ?? 'traveler',
    isLocked:    Boolean(u.is_locked  ?? u.isLocked),
    isOnline:    Boolean(u.is_online  ?? u.isOnline),
    createdAt:   u.created_at   ?? u.createdAt   ?? null,
    updatedAt:   u.updated_at   ?? u.updatedAt   ?? null,
    lastLoginAt: u.last_login_at ?? u.lastLoginAt ?? null,
})

// Map order row — kết hợp cột riêng và JSON blob
const mapOrder = (o) => {
    const data = o.order_data
        ? (typeof o.order_data === 'string' ? JSON.parse(o.order_data) : o.order_data)
        : {}
    return {
        id:            o.id,
        status:        o.status,
        createdAt:     o.created_at    ?? o.createdAt,
        // Thông tin khách hàng
        userName:      o.full_name     ?? data.userName   ?? '',
        userEmail:     o.email         ?? data.userEmail  ?? '',
        // Thông tin đặt dịch vụ (ưu tiên cột riêng, fallback sang JSON blob)
        location:      o.location      ?? data.location   ?? '',
        date:          o.date          ?? data.date        ?? '',
        checkOut:      o.checkOut      ?? data.checkOut   ?? '',
        total:         o.total         ?? data.total       ?? 0,
        subTotal:      o.subTotal      ?? data.subTotal   ?? 0,
        tax:           o.tax           ?? data.tax         ?? 0,
        paymentMethod: o.paymentMethod ?? data.paymentMethod ?? '',
        paymentStatus: o.paymentStatus ?? '',
        items:         data.items      ?? [],
        notes:         o.notes        ?? data.notes       ?? '',
        ...data,
    }
}

// ── Session ──────────────────────────────────────────────────────
export const clearAuthSession = async () => {
    try { await api.post('/auth/logout', {}) } catch {}
    localStorage.removeItem('daytrip-token')
}

export const getStoredSession = () => {
    const token = localStorage.getItem('daytrip-token')
    return token ? { token } : null
}

export const getCurrentAuthenticatedUser = async () => {
    if (!localStorage.getItem('daytrip-token')) return null
    try {
        return await api.get('/auth/me')
    } catch {
        localStorage.removeItem('daytrip-token')
        return null
    }
}

// ── Auth ─────────────────────────────────────────────────────────
export const registerUser = async ({ fullName, email, phone, homeCity, password }) => {
    await api.post('/auth/register', { fullName, email, phone, homeCity, password })
    return signInUser({ email, password })
}

export const signInUser = async ({ email, password }) => {
    const data = await api.post('/auth/login', { email, password })
    localStorage.setItem('daytrip-token', data.token)
    return data.user
}

export const resetUserPassword = (email) => api.post('/auth/reset-password', { email })

export const changeUserPassword = (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword })

// OAuth — requires server-side OAuth setup (not yet implemented)
export const signInWithGoogle = async () => {
    throw new Error('Đăng nhập Google chưa khả dụng. Vui lòng dùng email và mật khẩu.')
}

export const signInWithFacebook = async () => {
    throw new Error('Đăng nhập Facebook chưa khả dụng. Vui lòng dùng email và mật khẩu.')
}

// Password reset via link — not yet implemented without email service
export const verifyResetCode   = async () => { throw new Error('Tính năng này chưa khả dụng.') }
export const applyPasswordReset = async () => { throw new Error('Tính năng này chưa khả dụng.') }

// ── Users ────────────────────────────────────────────────────────
export const getRegisteredUsers = async () => {
    const users = await api.get('/users')
    return Array.isArray(users) ? users.map(mapUser) : []
}

export const deleteUserById  = (userId)        => api.delete(`/users/${userId}`)
export const updateUserRole  = (userId, role)  => api.patch(`/users/${userId}/role`, { role })
export const toggleUserLock  = (userId, isLocked) => api.patch(`/users/${userId}/lock`, { isLocked })
export const setUserOnline   = (userId, isOnline) => api.patch(`/users/${userId}/online`, { isOnline })

export const updateUserProfile = async (userId, data) => {
    const updated = await api.patch(`/users/${userId}`, data)
    return updated
}

// ── Orders ───────────────────────────────────────────────────────
export const saveOrder = (orderData) => api.post('/orders', orderData)

export const getOrders = async () => {
    const orders = await api.get('/orders/all')
    return Array.isArray(orders) ? orders.map(mapOrder) : []
}

export const getMyOrders = async () => {
    const orders = await api.get('/orders/mine')
    return Array.isArray(orders) ? orders.map(mapOrder) : []
}

export const updateOrderStatus = (orderId, status) => api.patch(`/orders/${orderId}/status`, { status })
