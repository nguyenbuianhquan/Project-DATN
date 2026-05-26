import express    from 'express'
import crypto     from 'crypto'
import querystring from 'querystring'
import axios      from 'axios'
import db         from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js'

const router = express.Router()

// ══════════════════════════════════════════════════════════════════
//  VNPAY — Tạo URL thanh toán
//  POST /api/payments/vnpay/create
//  Body: { orderId, amount, orderInfo }
// ══════════════════════════════════════════════════════════════════
router.post('/vnpay/create', requireAuth, async (req, res) => {
    const { orderId, amount, orderInfo } = req.body
    if (!orderId || !amount) return res.status(400).json({ error: 'Thiếu orderId hoặc amount' })

    // Lấy IP khách
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
    const ipAddr = rawIp.replace('::ffff:', '').replace('::1', '127.0.0.1').split(',')[0].trim()

    // Tạo mã giao dịch ngắn (max 40 ký tự, duy nhất trong ngày)
    const txnRef = orderId.replace(/-/g, '').slice(0, 30)

    // Ngày tạo (format: YYYYMMDDHHmmss theo múi giờ +7)
    const now = new Date(Date.now() + 7 * 3600 * 1000)
    const createDate = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)

    // Tập hợp tham số gửi VNPay
    let params = {
        vnp_Version:    '2.1.0',
        vnp_Command:    'pay',
        vnp_TmnCode:    process.env.VNPAY_TMN_CODE,
        vnp_Locale:     'vn',
        vnp_CurrCode:   'VND',
        vnp_TxnRef:     txnRef,
        vnp_OrderInfo:  orderInfo || `Thanh toan ${orderId}`,
        vnp_OrderType:  'other',
        vnp_Amount:     Math.round(amount) * 100,   // VNPay: nhân 100
        vnp_ReturnUrl:  process.env.VNPAY_RETURN_URL,
        vnp_IpAddr:     ipAddr,
        vnp_CreateDate: createDate,
    }

    // Sắp xếp tham số theo alphabet (bắt buộc của VNPay)
    params = Object.fromEntries(
        Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
    )

    // Ký HMAC-SHA512
    const signData = querystring.stringify(params, { encode: false })
    const signed   = crypto
        .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex')

    params['vnp_SecureHash'] = signed

    // Lưu txnRef vào bảng payments để tra cứu khi verify
    await db.query(
        `UPDATE payments SET transaction_id = ? WHERE order_id = ?`,
        [txnRef, orderId]
    )

    const payUrl = process.env.VNPAY_URL + '?' + querystring.stringify(params, { encode: false })
    res.json({ payUrl })
})

// ══════════════════════════════════════════════════════════════════
//  VNPAY — Xác minh kết quả trả về (backend verify)
//  GET /api/payments/vnpay/verify?vnp_*=...
// ══════════════════════════════════════════════════════════════════
router.get('/vnpay/verify', async (req, res) => {
    const query        = { ...req.query }
    const secureHash   = query['vnp_SecureHash']

    // Xóa hash trước khi tính lại
    delete query['vnp_SecureHash']
    delete query['vnp_SecureHashType']

    // Sắp xếp + tính lại chữ ký
    const sortedParams = Object.fromEntries(
        Object.entries(query).sort(([a], [b]) => a.localeCompare(b))
    )
    const signData = querystring.stringify(sortedParams, { encode: false })
    const signed   = crypto
        .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex')

    if (signed !== secureHash) {
        return res.status(400).json({ success: false, error: 'Chữ ký không hợp lệ' })
    }

    const responseCode = query['vnp_ResponseCode']
    const txnRef       = query['vnp_TxnRef']
    const amount       = parseInt(query['vnp_Amount']) / 100

    // Tìm payment qua txnRef
    const [rows] = await db.query(
        `SELECT p.id, p.order_id FROM payments p WHERE p.transaction_id = ?`,
        [txnRef]
    )
    if (!rows.length) return res.status(404).json({ success: false, error: 'Không tìm thấy giao dịch' })

    const { id: paymentId, order_id: orderId } = rows[0]

    if (responseCode === '00') {
        // ── Thành công ──
        await db.query(
            `UPDATE payments SET status='paid', paid_at=NOW(), gateway_response=? WHERE id=?`,
            [JSON.stringify(req.query), paymentId]
        )
        await db.query(`UPDATE orders SET status='confirmed' WHERE id=?`, [orderId])
        return res.json({ success: true, orderId, amount })
    } else {
        // ── Thất bại / huỷ ──
        await db.query(
            `UPDATE payments SET status='failed', gateway_response=? WHERE id=?`,
            [JSON.stringify(req.query), paymentId]
        )
        return res.json({
            success: false,
            orderId,
            code:    responseCode,
            error:   vnpayErrorMsg(responseCode),
        })
    }
})

// Helper — mã lỗi VNPay → thông báo tiếng Việt
function vnpayErrorMsg(code) {
    const msgs = {
        '07': 'Trừ tiền thành công, giao dịch bị nghi ngờ. Liên hệ VNPay để xử lý.',
        '09': 'Thẻ/Tài khoản chưa đăng ký Internet Banking.',
        '10': 'Xác thực thông tin thẻ/tài khoản quá 3 lần.',
        '11': 'Phiên thanh toán hết hạn. Vui lòng thực hiện lại.',
        '12': 'Thẻ/Tài khoản bị khóa.',
        '13': 'Sai mật khẩu OTP.',
        '24': 'Khách hàng hủy giao dịch.',
        '51': 'Số dư không đủ để thực hiện giao dịch.',
        '65': 'Vượt hạn mức giao dịch trong ngày.',
        '75': 'Ngân hàng tạm thời đình chỉ.',
        '79': 'Sai mật khẩu quá số lần quy định.',
        '99': 'Lỗi không xác định.',
    }
    return msgs[code] || `Thanh toán thất bại (mã lỗi: ${code})`
}

// ══════════════════════════════════════════════════════════════════
//  MOMO — Tạo URL thanh toán
//  POST /api/payments/momo/create
//  Body: { orderId, amount, orderInfo }
// ══════════════════════════════════════════════════════════════════
router.post('/momo/create', requireAuth, async (req, res) => {
    const { orderId, amount, orderInfo } = req.body
    if (!orderId || !amount) return res.status(400).json({ error: 'Thiếu orderId hoặc amount' })

    const partnerCode  = process.env.MOMO_PARTNER_CODE
    const accessKey    = process.env.MOMO_ACCESS_KEY
    const secretKey    = process.env.MOMO_SECRET_KEY
    const redirectUrl  = process.env.MOMO_REDIRECT_URL
    const ipnUrl       = process.env.MOMO_IPN_URL
    const requestType  = 'captureWallet'   // Ví MoMo / QR
    const extraData    = ''

    // MoMo orderId: không dấu, tối đa 50 ký tự
    const momoOrderId  = orderId.replace(/-/g, '').slice(0, 50)
    const requestId    = momoOrderId
    const orderInfoStr = orderInfo || 'Thanh toan DayTrip'
    const amountStr    = Math.round(amount).toString()

    // Chuỗi ký theo thứ tự MoMo quy định
    const rawSignature =
        `accessKey=${accessKey}` +
        `&amount=${amountStr}` +
        `&extraData=${extraData}` +
        `&ipnUrl=${ipnUrl}` +
        `&orderId=${momoOrderId}` +
        `&orderInfo=${orderInfoStr}` +
        `&partnerCode=${partnerCode}` +
        `&redirectUrl=${redirectUrl}` +
        `&requestId=${requestId}` +
        `&requestType=${requestType}`

    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex')

    const body = {
        partnerCode,
        accessKey,
        requestId,
        amount:       amountStr,
        orderId:      momoOrderId,
        orderInfo:    orderInfoStr,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: 'vi',
    }

    try {
        const { data } = await axios.post(process.env.MOMO_API_URL, body, { timeout: 10000 })
        if (data.resultCode !== 0) {
            return res.status(400).json({ error: data.message || 'MoMo từ chối tạo thanh toán' })
        }

        // Lưu momoOrderId để tra cứu khi verify
        await db.query(
            `UPDATE payments SET transaction_id = ? WHERE order_id = ?`,
            [momoOrderId, orderId]
        )

        res.json({ payUrl: data.payUrl })
    } catch (err) {
        console.error('[momo/create]', err.response?.data || err.message)
        res.status(500).json({ error: 'Không kết nối được MoMo. Vui lòng thử lại.' })
    }
})

// ══════════════════════════════════════════════════════════════════
//  MOMO — Xác minh kết quả trả về
//  GET /api/payments/momo/verify?resultCode=...&orderId=...
// ══════════════════════════════════════════════════════════════════
router.get('/momo/verify', async (req, res) => {
    // Log toàn bộ params nhận được để debug
    console.log('[momo/verify] params:', JSON.stringify(req.query, null, 2))

    const {
        partnerCode, orderId, requestId, amount,
        orderInfo, orderType, transId, resultCode,
        message, payType, responseTime, extraData,
        signature: momoSig,
    } = req.query

    // ── Kiểm tra resultCode: 0 = thành công (có thể là string hoặc number) ──
    const isSuccess = String(resultCode) === '0'

    console.log(`[momo/verify] resultCode="${resultCode}" → isSuccess=${isSuccess}`)
    console.log(`[momo/verify] orderId="${orderId}" requestId="${requestId}"`)

    // ── Tìm payment record (thử 2 cách) ────────────────────────────
    // Cách 1: tìm theo transaction_id = orderId (chuẩn)
    let [rows] = await db.query(
        `SELECT p.id, p.order_id FROM payments p WHERE p.transaction_id = ?`,
        [orderId]
    )

    // Cách 2 (fallback): nếu không tìm thấy, thử tìm theo requestId
    if (!rows.length && requestId) {
        ;[rows] = await db.query(
            `SELECT p.id, p.order_id FROM payments p WHERE p.transaction_id = ?`,
            [requestId]
        )
        if (rows.length) console.log('[momo/verify] Found via requestId fallback')
    }

    if (!rows.length) {
        console.error(`[momo/verify] Payment NOT FOUND for orderId="${orderId}"`)
        // Trả về kết quả theo resultCode dù không tìm được payment record
        // (tránh hiện lỗi kỳ lạ cho user)
        if (isSuccess) {
            return res.json({ success: true, amount: parseInt(amount) || 0 })
        }
        return res.json({
            success: false,
            error: momoErrorMsg(String(resultCode)),
        })
    }

    const { id: paymentId, order_id: dbOrderId } = rows[0]
    console.log(`[momo/verify] Found paymentId="${paymentId}" orderId="${dbOrderId}"`)

    try {
        if (isSuccess) {
            // ── Thanh toán thành công ──
            await db.query(
                `UPDATE payments SET status='paid', paid_at=NOW(), gateway_response=? WHERE id=?`,
                [JSON.stringify(req.query), paymentId]
            )
            await db.query(`UPDATE orders SET status='confirmed' WHERE id=?`, [dbOrderId])
            console.log(`[momo/verify] ✅ Order ${dbOrderId} confirmed`)
            return res.json({ success: true, orderId: dbOrderId, amount: parseInt(amount) || 0 })
        } else {
            // ── Thanh toán thất bại / bị hủy ──
            await db.query(
                `UPDATE payments SET status='failed', gateway_response=? WHERE id=?`,
                [JSON.stringify(req.query), paymentId]
            )
            console.log(`[momo/verify] ❌ resultCode=${resultCode} — ${message}`)
            return res.json({
                success: false,
                orderId: dbOrderId,
                error:   momoErrorMsg(String(resultCode), message),
            })
        }
    } catch (dbErr) {
        console.error('[momo/verify] DB error:', dbErr.message)
        // Vẫn trả về kết quả đúng cho user dù DB lỗi
        return res.json({ success: isSuccess, orderId: dbOrderId })
    }
})

// Helper — mã lỗi MoMo → thông báo tiếng Việt
function momoErrorMsg(code, defaultMsg) {
    const msgs = {
        '1001': 'Giao dịch thất bại do lỗi hệ thống MoMo.',
        '1002': 'Giao dịch bị từ chối bởi ngân hàng phát hành.',
        '1003': 'Giao dịch đã bị hủy (hết thời gian chờ).',
        '1004': 'Số tiền giao dịch vượt hạn mức thanh toán.',
        '1005': 'Phiên thanh toán đã hết hạn.',
        '1006': 'Giao dịch bị từ chối bởi người dùng.',
        '1007': 'Tài khoản MoMo không tồn tại hoặc đã bị khóa.',
        '1026': 'Giao dịch bị hạn chế theo chính sách MoMo.',
        '1080': 'Giao dịch hoàn tiền không thành công.',
        '1081': 'Giao dịch hoàn tiền bị từ chối.',
        '2019': 'Loại đơn hàng không hợp lệ.',
        '4001': 'Giao dịch bị hạn chế do vi phạm.',
        '4100': 'Người dùng chưa đăng nhập vào MoMo.',
        '7000': 'Giao dịch đang được xử lý.',
        '7002': 'Giao dịch đang xử lý (bởi nhà cung cấp).',
        '9000': 'Giao dịch đã được xác nhận thành công.',
    }
    return msgs[code] || defaultMsg || `Thanh toán thất bại (mã: ${code})`
}

// ══════════════════════════════════════════════════════════════════
//  MOMO — IPN (Server-to-Server callback, cần ngrok để dùng)
//  POST /api/payments/momo/ipn
// ══════════════════════════════════════════════════════════════════
router.post('/momo/ipn', async (req, res) => {
    const { orderId, resultCode, transId, amount } = req.body
    console.log('[momo/ipn] Received:', req.body)

    try {
        const [rows] = await db.query(
            `SELECT p.id, p.order_id FROM payments p WHERE p.transaction_id = ?`,
            [orderId]
        )
        if (rows.length && resultCode === 0) {
            await db.query(
                `UPDATE payments SET status='paid', paid_at=NOW(), gateway_response=? WHERE id=?`,
                [JSON.stringify(req.body), rows[0].id]
            )
            await db.query(`UPDATE orders SET status='confirmed' WHERE id=?`, [rows[0].order_id])
        }
        res.status(204).end()
    } catch (err) {
        console.error('[momo/ipn]', err)
        res.status(500).end()
    }
})

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
