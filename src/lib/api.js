const BASE = 'http://localhost:3001/api'

const getToken = () => localStorage.getItem('daytrip-token')

const headers = () => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

const handle = async (res) => {
    const data = await res.json()
    if (!res.ok) {
        const err = new Error(data.error || 'Đã xảy ra lỗi.')
        err.status = res.status          // ← Gắn HTTP status để frontend kiểm tra (vd: 409)
        err.code   = data.code || null   // ← Gắn error code (vd: 'RESERVATION_EXPIRED')
        throw err
    }
    return data
}

export const api = {
    get:    (path)       => fetch(`${BASE}${path}`, { headers: headers() }).then(handle),
    post:   (path, body) => fetch(`${BASE}${path}`, { method: 'POST',   headers: headers(), body: JSON.stringify(body) }).then(handle),
    patch:  (path, body) => fetch(`${BASE}${path}`, { method: 'PATCH',  headers: headers(), body: JSON.stringify(body) }).then(handle),
    delete: (path)       => fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() }).then(handle),
}
