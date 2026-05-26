/**
 * /api/rooms — Quản lý giữ chỗ phòng tạm thời
 *
 * Giải quyết race condition: 2 khách cùng đặt 1 phòng cuối cùng
 * Cơ chế: Giữ chỗ 10 phút (khớp countdown trên UI checkout)
 *         → Người đặt đầu tiên được giữ chỗ
 *         → Người thứ 2 nhận ngay lỗi "Phòng đang được giữ"
 */

import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = express.Router()

// ── Hàm dọn dẹp reservation hết hạn ──────────────────────────────
const expireOldReservations = async (conn) => {
    await conn.query(
        `UPDATE room_reservations
         SET status = 'expired'
         WHERE status = 'holding' AND expires_at < NOW()`
    )
}

// ══════════════════════════════════════════════════════════════════
// POST /api/rooms/reserve — Giữ chỗ tạm thời (10 phút)
// ──────────────────────────────────────────────────────────────────
// Body: { hotelId, roomId, checkIn, checkOut }
// Trả về: { reservationId, expiresAt } hoặc 409 nếu bị trùng
// ══════════════════════════════════════════════════════════════════
router.post('/reserve', requireAuth, async (req, res) => {
    const { hotelId, roomId, checkIn, checkOut } = req.body

    // Validate input
    if (!hotelId || !roomId) {
        return res.status(400).json({ error: 'Thiếu thông tin khách sạn / phòng.' })
    }
    if (!checkIn || !checkOut) {
        return res.status(400).json({ error: 'Vui lòng chọn ngày nhận phòng và trả phòng.' })
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
        return res.status(400).json({ error: 'Ngày trả phòng phải sau ngày nhận phòng.' })
    }

    const conn = await db.getConnection()
    try {
        await conn.beginTransaction()

        // 1. Dọn dẹp các giữ chỗ đã hết hạn trước khi kiểm tra
        await expireOldReservations(conn)

        // 2. Kiểm tra xem phòng có bị chiếm không (overlap ngày)
        //    Điều kiện overlap: check_in mới < check_out cũ VÀ check_out mới > check_in cũ
        const [conflicts] = await conn.query(
            `SELECT id, user_id, expires_at, status
             FROM room_reservations
             WHERE hotel_id = ?
               AND room_id  = ?
               AND status IN ('holding', 'confirmed')
               AND check_in  < ?
               AND check_out > ?`,
            [String(hotelId), String(roomId), checkOut, checkIn]
        )

        if (conflicts.length > 0) {
            const conflict = conflicts[0]
            const isOwnReservation = conflict.user_id === req.user.userId

            await conn.rollback()

            if (isOwnReservation && conflict.status === 'holding') {
                // Chính user này đã giữ trước đó → trả lại reservationId cũ
                return res.json({
                    reservationId: conflict.id,
                    expiresAt:     conflict.expires_at,
                    reused:        true,
                    message:       'Bạn đã giữ phòng này. Tiếp tục thanh toán.',
                })
            }

            // Người khác đang giữ hoặc đã xác nhận
            const waitMsg = conflict.status === 'holding'
                ? 'Phòng này đang được khách khác giữ chỗ. Vui lòng chọn phòng khác hoặc thử lại sau.'
                : 'Phòng này đã được đặt cho khoảng thời gian bạn chọn. Vui lòng chọn phòng hoặc ngày khác.'

            return res.status(409).json({ error: waitMsg, code: 'ROOM_HELD' })
        }

        // 3. Tạo reservation mới — hết hạn sau đúng 10 phút
        const reservationId = uuidv4()
        const expiresAt     = new Date(Date.now() + 10 * 60 * 1000) // 10 phút

        await conn.query(
            `INSERT INTO room_reservations
               (id, hotel_id, room_id, check_in, check_out, user_id, expires_at, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'holding')`,
            [
                reservationId,
                String(hotelId),
                String(roomId),
                checkIn,
                checkOut,
                req.user.userId,
                expiresAt,
            ]
        )

        await conn.commit()

        return res.status(201).json({
            reservationId,
            expiresAt: expiresAt.toISOString(),
            message:   'Phòng đã được giữ trong 10 phút. Vui lòng hoàn tất thanh toán.',
        })

    } catch (err) {
        await conn.rollback()
        console.error('[rooms/reserve POST]', err)
        return res.status(500).json({ error: 'Lỗi hệ thống khi giữ chỗ. Vui lòng thử lại.' })
    } finally {
        conn.release()
    }
})

// ══════════════════════════════════════════════════════════════════
// DELETE /api/rooms/reserve/:id — Hủy giữ chỗ (user tự hủy)
// ══════════════════════════════════════════════════════════════════
router.delete('/reserve/:id', requireAuth, async (req, res) => {
    try {
        const [result] = await db.query(
            `UPDATE room_reservations
             SET status = 'cancelled'
             WHERE id = ? AND user_id = ? AND status = 'holding'`,
            [req.params.id, req.user.userId]
        )

        if (result.affectedRows === 0) {
            // Không tìm thấy hoặc không thuộc user này — coi như thành công
            return res.json({ message: 'Không có giữ chỗ nào cần hủy.' })
        }

        return res.json({ message: 'Đã hủy giữ chỗ thành công.' })
    } catch (err) {
        console.error('[rooms/reserve DELETE]', err)
        return res.status(500).json({ error: err.message })
    }
})

// ══════════════════════════════════════════════════════════════════
// GET /api/rooms/status/:hotelId/:roomId — Kiểm tra trạng thái phòng
// Dùng để refresh UI nếu cần
// ══════════════════════════════════════════════════════════════════
router.get('/status/:hotelId/:roomId', async (req, res) => {
    try {
        const { hotelId, roomId } = req.params
        const { checkIn, checkOut } = req.query

        // Dọn hết hạn trước
        await db.query(
            `UPDATE room_reservations
             SET status = 'expired'
             WHERE status = 'holding' AND expires_at < NOW()`
        )

        let query = `
            SELECT status, expires_at
            FROM room_reservations
            WHERE hotel_id = ? AND room_id = ? AND status IN ('holding','confirmed')`
        const params = [String(hotelId), String(roomId)]

        if (checkIn && checkOut) {
            query += ` AND check_in < ? AND check_out > ?`
            params.push(checkOut, checkIn)
        }

        query += ` LIMIT 1`

        const [rows] = await db.query(query, params)

        if (rows.length === 0) {
            return res.json({ available: true })
        }

        return res.json({
            available:  false,
            status:     rows[0].status,
            expiresAt:  rows[0].expires_at,
        })
    } catch (err) {
        console.error('[rooms/status GET]', err)
        return res.status(500).json({ error: err.message })
    }
})

export default router
