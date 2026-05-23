import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { saveOrder } from "../../lib/authStorage";

const StepBar = ({ current }) => {
    const steps = ["Thông tin", "Thanh toán", "Hoàn tất"];
    return (
        <div className="cp-steps">
            {steps.map((label, i) => {
                const n = i + 1;
                const done = n < current, active = n === current;
                return (
                    <React.Fragment key={n}>
                        <div className={`cp-step ${done ? "cp-step-done" : ""} ${active ? "cp-step-active" : ""}`}>
                            <div className="cp-step-circle">{done ? <i className="bi bi-check-lg"></i> : n}</div>
                            <span className="cp-step-label">{label}</span>
                        </div>
                        {i < steps.length - 1 && <div className={`cp-step-line ${done ? "cp-step-line-done" : ""}`} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const ONLINE_METHODS = [
    { id: "paypal",  label: "PayPal",       icon: "bi-paypal",              color: "#0070ba" },
    { id: "visa",    label: "Visa",         icon: "bi-credit-card-2-front", color: "#1a1f71" },
    { id: "master",  label: "Mastercard",   icon: "bi-credit-card-fill",    color: "#eb001b" },
    { id: "bank",    label: "Thẻ nội địa",  icon: "bi-bank",                color: "#f26f55" },
    { id: "vnpay",   label: "VNPay",        icon: "bi-qr-code",             color: "#e3000e" },
];

const fmtVND = (n) => Math.round(n).toLocaleString('vi-VN') + ' ₫';

const PaymentPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [tab,     setTab]     = useState("card");
    const [method,  setMethod]  = useState("paypal");
    const [agreed,  setAgreed]  = useState(false);
    const [card,    setCard]    = useState({ name: "", number: "", expiry: "", cvv: "" });
    const [booking, setBooking] = useState({ date: "", checkOut: "", subTotal: 0, tax: 0, total: 0 });
    const [paying,  setPaying]  = useState(false);
    const [payError,setPayError]= useState("");

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("bookingStepData") || "null");
        if (stored) {
            const tot = parseFloat(stored.total || 0);
            const sub = parseFloat(stored.subtotal || 0);
            const vat = parseFloat(stored.vat || tot - sub);
            setBooking({ date: stored.checkInDate || "", checkOut: stored.checkOutDate || "", subTotal: sub, tax: vat, total: tot });
        }
    }, []);

    const fmt = (d) => {
        if (!d) return "";
        const [y, m, day] = d.split("-");
        return `${day}/${m}/${y}`;
    };

    const onCardChange = (e) => {
        let { name, value } = e.target;
        if (name === "number") value = value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
        if (name === "expiry") value = value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
        if (name === "cvv")    value = value.replace(/\D/g, "").slice(0, 4);
        setCard(p => ({ ...p, [name]: value }));
    };

    const handlePay = async () => {
        if (paying) return;
        setPaying(true);
        setPayError("");
        try {
            const bookingItem = JSON.parse(localStorage.getItem("bookingItem") || "null");
            const stored      = JSON.parse(localStorage.getItem("bookingStepData") || "{}");
            if (currentUser) {
                await saveOrder({
                    userId:        currentUser.id,
                    userName:      currentUser.fullName,
                    userEmail:     currentUser.email,
                    location:      stored.location || bookingItem?.location || "Điểm đến đã chọn",
                    date:          booking.date,
                    checkOut:      booking.checkOut,
                    subTotal:      booking.subTotal,
                    tax:           booking.tax,
                    total:         booking.total,
                    paymentTab:    tab,
                    paymentMethod: tab === "online" ? method : "card",
                    items:         bookingItem ? [{ name: bookingItem.title || "Dịch vụ", price: bookingItem.price }] : [],
                });
            }
            localStorage.removeItem("bookingItem");
            localStorage.removeItem("bookingStepData");
            navigate("/Tour_Booking_Summery", {
                state: { ...booking, customerName: currentUser?.fullName || "", customerEmail: currentUser?.email || "" },
            });
        } catch (err) {
            setPayError("Lưu đơn hàng thất bại: " + (err.message || "Vui lòng thử lại."));
        } finally {
            setPaying(false);
        }
    };

    const { date, checkOut, subTotal, tax, total } = booking;
    const cardReady = tab === "online" || (
        card.name.trim() &&
        card.number.replace(/\s/g, "").length === 16 &&
        card.expiry.length === 5 &&
        card.cvv.length >= 3
    );
    const canPay = agreed && cardReady;

    return (
        <div className="cp-root">
            <div className="container">
                <div className="cp-header">
                    <h2 className="cp-title">Thanh toán</h2>
                    <p className="cp-breadcrumb">
                        <Link to="/">Trang chủ</Link> / <Link to="/booking-info">Thông tin</Link> / Thanh toán
                    </p>
                    <StepBar current={2} />
                </div>

                <div className="cp-body">
                    {/* Payment form */}
                    <div className="cp-items-col">

                        {/* Tab switcher */}
                        <div className="pay-tabs">
                            <button className={`pay-tab ${tab === "card" ? "pay-tab-active" : ""}`} onClick={() => setTab("card")}>
                                <i className="bi bi-credit-card"></i>
                                <span>Thẻ ngân hàng</span>
                            </button>
                            <button className={`pay-tab ${tab === "online" ? "pay-tab-active" : ""}`} onClick={() => setTab("online")}>
                                <i className="bi bi-phone"></i>
                                <span>Thanh toán trực tuyến</span>
                            </button>
                        </div>

                        {tab === "card" ? (
                            <div className="pay-fields">
                                <div className="pay-field pay-field-full">
                                    <label className="pay-label">Tên trên thẻ</label>
                                    <div className="pay-input-wrap">
                                        <i className="bi bi-person pay-input-icon"></i>
                                        <input name="name" className="pay-input" placeholder="NGUYEN VAN A"
                                            value={card.name} onChange={onCardChange} autoComplete="cc-name" />
                                    </div>
                                </div>
                                <div className="pay-field pay-field-full">
                                    <label className="pay-label">Số thẻ</label>
                                    <div className="pay-input-wrap">
                                        <i className="bi bi-credit-card pay-input-icon"></i>
                                        <input name="number" className="pay-input" placeholder="1234 5678 9012 3456"
                                            value={card.number} onChange={onCardChange} autoComplete="cc-number" />
                                    </div>
                                </div>
                                <div className="pay-field">
                                    <label className="pay-label">Ngày hết hạn</label>
                                    <div className="pay-input-wrap">
                                        <i className="bi bi-calendar-event pay-input-icon"></i>
                                        <input name="expiry" className="pay-input" placeholder="MM/YY"
                                            value={card.expiry} onChange={onCardChange} autoComplete="cc-exp" />
                                    </div>
                                </div>
                                <div className="pay-field">
                                    <label className="pay-label">CVV</label>
                                    <div className="pay-input-wrap">
                                        <i className="bi bi-shield-lock pay-input-icon"></i>
                                        <input name="cvv" type="password" className="pay-input" placeholder="•••"
                                            maxLength={4} value={card.cvv} onChange={onCardChange} autoComplete="cc-csc" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="pay-online-form">
                                <p className="pay-online-desc">Chọn phương thức thanh toán</p>
                                <div className="pay-methods">
                                    {ONLINE_METHODS.map(m => (
                                        <button
                                            key={m.id}
                                            className={`pay-method-card ${method === m.id ? "pay-method-active" : ""}`}
                                            onClick={() => setMethod(m.id)}
                                        >
                                            <div className="pay-method-icon-wrap">
                                                <i className={`bi ${m.icon}`} style={{ color: m.color }}></i>
                                            </div>
                                            <span className="pay-method-label">{m.label}</span>
                                            {method === m.id && <i className="bi bi-check-circle-fill pay-method-check"></i>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {payError && (
                            <div className="pay-error">
                                <i className="bi bi-exclamation-triangle-fill"></i> {payError}
                            </div>
                        )}

                        <div className="pay-footer">
                            <label className="pay-agree">
                                <input type="checkbox" className="af-checkbox" checked={agreed}
                                    onChange={e => setAgreed(e.target.checked)} />
                                <span>
                                    Tôi đồng ý với{" "}
                                    <a href="#" className="pay-link">Điều khoản dịch vụ</a>
                                    {" "}và{" "}
                                    <a href="#" className="pay-link">Chính sách bảo mật</a>
                                </span>
                            </label>

                            <button className="pay-submit-btn" onClick={handlePay} disabled={!canPay || paying}>
                                {paying
                                    ? <><span className="af-spinner"></span>Đang xử lý...</>
                                    : <><i className="bi bi-lock-fill"></i>{total > 0 ? ` Thanh toán ${fmtVND(total)}` : " Thanh toán"}</>
                                }
                            </button>

                            <div className="pay-security">
                                <i className="bi bi-shield-check"></i>
                                Giao dịch mã hóa SSL 256-bit · An toàn tuyệt đối
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="cp-summary-col">
                        <div className="cp-summary-card">
                            <h3 className="cp-summary-title">Tóm tắt đặt dịch vụ</h3>

                            {(date || checkOut) && (
                                <div className="pay-date-row">
                                    <div className="pay-date-item">
                                        <span className="pay-date-label"><i className="bi bi-box-arrow-in-right"></i> Ngày đến</span>
                                        <span className="pay-date-val">{fmt(date) || "—"}</span>
                                    </div>
                                    {checkOut && (
                                        <>
                                            <i className="bi bi-arrow-right pay-date-arrow"></i>
                                            <div className="pay-date-item">
                                                <span className="pay-date-label"><i className="bi bi-box-arrow-right"></i> Ngày về</span>
                                                <span className="pay-date-val">{fmt(checkOut)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="cp-price-rows">
                                <div className="cp-price-row">
                                    <span>Tạm tính</span>
                                    <span>{fmtVND(subTotal)}</span>
                                </div>
                                <div className="cp-price-row">
                                    <span>Thuế & phí (10%)</span>
                                    <span>{fmtVND(tax)}</span>
                                </div>
                                <div className="cp-price-row cp-price-total">
                                    <span>Tổng cộng</span>
                                    <span className="cp-total-num">{fmtVND(total)}</span>
                                </div>
                            </div>

                            <div className="pay-badges">
                                <div className="pay-badge"><i className="bi bi-shield-check"></i><span>Bảo mật SSL</span></div>
                                <div className="pay-badge"><i className="bi bi-arrow-counterclockwise"></i><span>Hoàn tiền 24h</span></div>
                                <div className="pay-badge"><i className="bi bi-headset"></i><span>Hỗ trợ 24/7</span></div>
                            </div>

                            <div className="pay-accepted-cards">
                                <i className="bi bi-paypal"              title="PayPal"></i>
                                <i className="bi bi-credit-card-2-front" title="Visa"></i>
                                <i className="bi bi-credit-card-fill"    title="Mastercard"></i>
                                <i className="bi bi-bank"                title="Thẻ nội địa"></i>
                                <i className="bi bi-qr-code"             title="VNPay"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
