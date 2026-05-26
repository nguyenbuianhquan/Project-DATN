/**
 * PaymentReturn.jsx
 *
 * Trang nhận kết quả sau khi cổng thanh toán (VNPay / MoMo) redirect về.
 * URL: /payment-return?vnp_ResponseCode=...  (VNPay)
 *      /payment-return?resultCode=...        (MoMo)
 *
 * Luồng:
 *   1. Đọc query params → nhận biết gateway
 *   2. Gọi backend verify để xác thực chữ ký + cập nhật DB
 *   3. Hiển thị Success hoặc Failure
 */

import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../lib/api'

/* ─── helpers ─────────────────────────────────────────────── */
const fmtVND = n => Math.round(n).toLocaleString('vi-VN') + ' ₫'

/* ─── icon lớn ────────────────────────────────────────────── */
const BigIcon = ({ success }) =>
    success ? (
        <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg,#22c55e,#16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(34,197,94,.35)',
        }}>
            <i className="bi bi-check-lg" style={{ fontSize: 44, color: '#fff' }}></i>
        </div>
    ) : (
        <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg,#ef4444,#dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(239,68,68,.35)',
        }}>
            <i className="bi bi-x-lg" style={{ fontSize: 40, color: '#fff' }}></i>
        </div>
    )

/* ════════════════════════════════════════════════════════════
   PaymentReturn
════════════════════════════════════════════════════════════ */
const PaymentReturn = () => {
    const navigate = useNavigate()
    const { search } = useLocation()

    const [status,  setStatus]  = useState('loading')  // loading | success | failed | error
    const [data,    setData]    = useState(null)
    const [errMsg,  setErrMsg]  = useState('')
    const [gateway, setGateway] = useState('')

    useEffect(() => {
        const params = new URLSearchParams(search)

        /* ── Nhận biết gateway qua params ── */
        let gw = ''
        if (params.has('vnp_ResponseCode')) gw = 'vnpay'
        else if (params.has('resultCode'))  gw = 'momo'

        setGateway(gw)

        if (!gw) {
            setStatus('error')
            setErrMsg('Không xác định được cổng thanh toán.')
            return
        }

        /* ── Với MoMo: đọc luôn resultCode từ URL để hiển thị nhanh ──
           (trước khi gọi backend verify, tránh chờ lâu gây khó chịu) */
        if (gw === 'momo') {
            const rc = params.get('resultCode')
            if (rc !== '0') {
                // Bị hủy hoặc thất bại → hiện ngay, vẫn gọi verify để cập nhật DB
                const cancelMsg = rc === '1006'
                    ? 'Bạn đã hủy giao dịch MoMo.'
                    : `Thanh toán thất bại (mã: ${rc}).`
                setStatus('failed')
                setErrMsg(cancelMsg)
            }
        }

        /* ── Gọi backend verify (cập nhật DB + lấy kết quả chính xác) ── */
        const verifyUrl = `/payments/${gw}/verify?${params.toString()}`
        api.get(verifyUrl)
            .then(result => {
                setData(result)
                // Cập nhật lại status theo kết quả backend (override fast-read trên)
                setStatus(result.success ? 'success' : 'failed')
                if (!result.success) setErrMsg(result.error || 'Thanh toán không thành công.')
            })
            .catch(err => {
                // Nếu backend lỗi nhưng đã có fast-read → giữ nguyên
                if (status === 'loading') {
                    setStatus('error')
                    setErrMsg(err.message || 'Lỗi xác minh thanh toán.')
                }
            })
    }, [search])

    /* ── Loading ── */
    if (status === 'loading') {
        return (
            <div className="pr-root">
                <div className="pr-card" style={{ textAlign: 'center' }}>
                    <div className="pr-spinner" />
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        Đang xác minh kết quả thanh toán...
                    </p>
                </div>
            </div>
        )
    }

    /* ── Success ── */
    if (status === 'success') {
        return (
            <div className="pr-root">
                <div className="pr-card">
                    <div className="pr-icon-wrap"><BigIcon success /></div>

                    <h2 className="pr-title pr-success">Thanh toán thành công!</h2>
                    <p className="pr-subtitle">
                        Cảm ơn bạn đã đặt dịch vụ tại <strong>DayTrip</strong>.<br/>
                        Xác nhận đặt chỗ đã được gửi qua email của bạn.
                    </p>

                    {/* Gateway badge */}
                    <div className="pr-gateway-badge">
                        <i className={`bi ${gateway === 'vnpay' ? 'bi-qr-code-scan' : 'bi-phone-fill'}`}></i>
                        {gateway === 'vnpay' ? 'VNPay' : 'Ví MoMo'}
                    </div>

                    {data?.amount > 0 && (
                        <div className="pr-amount-block">
                            <span className="pr-amount-label">Số tiền đã thanh toán</span>
                            <span className="pr-amount-val">{fmtVND(data.amount)}</span>
                        </div>
                    )}

                    {/* Policies */}
                    <div className="pr-policies">
                        {[
                            { icon: 'bi-envelope-check', text: 'Email xác nhận đã được gửi' },
                            { icon: 'bi-shield-check',   text: 'Giao dịch được bảo mật SSL' },
                            { icon: 'bi-headset',        text: 'Hỗ trợ 24/7 nếu cần giúp đỡ' },
                        ].map((p, i) => (
                            <div key={i} className="pr-policy-item">
                                <i className={`bi ${p.icon}`}></i>
                                <span>{p.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pr-actions">
                        <button className="pr-btn pr-btn-primary" onClick={() => navigate('/account')}>
                            <i className="bi bi-receipt"></i> Xem đơn hàng
                        </button>
                        <button className="pr-btn pr-btn-ghost" onClick={() => navigate('/')}>
                            <i className="bi bi-house"></i> Trang chủ
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    /* ── Xác định có phải người dùng chủ động hủy không ── */
    const isUserCancel = errMsg?.includes('hủy') || errMsg?.includes('từ chối bởi người dùng')

    /* ── Failed / Error ── */
    return (
        <div className="pr-root">
            <div className="pr-card">
                <div className="pr-icon-wrap">
                    {isUserCancel
                        /* Icon hủy: màu vàng/cam, ít "nghiêm trọng" hơn */
                        ? <div style={{
                            width: 88, height: 88, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(245,158,11,.35)',
                          }}>
                              <i className="bi bi-x-circle" style={{ fontSize: 40, color: '#fff' }}></i>
                          </div>
                        : <BigIcon success={false} />
                    }
                </div>

                <h2 className="pr-title" style={{ color: isUserCancel ? '#fbbf24' : '#f87171' }}>
                    {isUserCancel ? 'Đã hủy thanh toán' : (status === 'error' ? 'Lỗi xác minh' : 'Thanh toán thất bại')}
                </h2>
                <p className="pr-subtitle">
                    {errMsg || 'Giao dịch không được hoàn thành. Vui lòng thử lại.'}
                </p>

                {gateway && (
                    <div className="pr-gateway-badge pr-badge-fail">
                        <i className={`bi ${gateway === 'vnpay' ? 'bi-qr-code-scan' : 'bi-phone-fill'}`}></i>
                        {gateway === 'vnpay' ? 'VNPay' : 'Ví MoMo'}
                    </div>
                )}

                <div className="pr-help-box">
                    <i className="bi bi-info-circle-fill"></i>
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Cần hỗ trợ?</div>
                        <div style={{ fontSize: 13, opacity: .8 }}>
                            Liên hệ DayTrip qua email <strong>support@daytrip.vn</strong> hoặc hotline <strong>1800 xxxx</strong>.
                            Đơn hàng của bạn vẫn được lưu với trạng thái <em>chờ thanh toán</em>.
                        </div>
                    </div>
                </div>

                <div className="pr-actions">
                    <button className="pr-btn pr-btn-primary" onClick={() => navigate('/checkout')}>
                        <i className="bi bi-arrow-counterclockwise"></i> Thử lại
                    </button>
                    <button className="pr-btn pr-btn-ghost" onClick={() => navigate('/')}>
                        <i className="bi bi-house"></i> Trang chủ
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PaymentReturn
