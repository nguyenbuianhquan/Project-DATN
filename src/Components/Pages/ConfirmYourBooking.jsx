import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const StepBar = ({ current }) => {
    const steps = ["Thông tin", "Thanh toán", "Hoàn tất"];
    return (
        <div className="cp-steps">
            {steps.map((label, i) => {
                const n = i + 1;
                const done = n < current;
                const active = n === current;
                return (
                    <React.Fragment key={n}>
                        <div className={`cp-step ${done ? "cp-step-done" : ""} ${active ? "cp-step-active" : ""}`}>
                            <div className="cp-step-circle">
                                {done ? <i className="bi bi-check-lg"></i> : n}
                            </div>
                            <span className="cp-step-label">{label}</span>
                        </div>
                        {i < steps.length - 1 && <div className={`cp-step-line ${done ? "cp-step-line-done" : ""}`} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const fmtVND = (n) => Math.round(n).toLocaleString('vi-VN') + ' ₫';

const CheckoutPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [cartItems,    setCartItems]    = useState([]);
    const [checkInDate,  setCheckInDate]  = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const checkInRef  = useRef(null);
    const checkOutRef = useRef(null);

    const [form, setForm] = useState({ fullName: "", email: "", phone: "", notes: "" });

    useEffect(() => {
        const item = JSON.parse(localStorage.getItem("bookingItem") || "null");
        setCartItems(item ? [item] : []);
        const today = new Date().toISOString().split("T")[0];
        setCheckInDate(today);
        const next = new Date(); next.setDate(next.getDate() + 1);
        setCheckOutDate(next.toISOString().split("T")[0]);
    }, []);

    useEffect(() => {
        if (currentUser) {
            setForm(f => ({
                ...f,
                fullName: f.fullName || currentUser.fullName || "",
                email:    f.email    || currentUser.email    || "",
            }));
        }
    }, [currentUser]);

    const onChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const fmt = (d) => {
        if (!d) return "Chọn ngày";
        const [y, m, day] = d.split("-");
        return `${day}/${m}/${y}`;
    };

    // price already includes 10% tax from detail page
    const total    = cartItems.reduce((t, it) => t + (parseFloat(it.price) || 0) * (it.quantity || 1), 0);
    const subtotal = Math.round(total / 1.1);
    const tax      = total - subtotal;

    const canContinue = form.fullName.trim() && form.email.trim() && form.phone.trim();

    const handleContinue = () => {
        if (!canContinue) return;
        const location = cartItems[0]?.location || cartItems[0]?.name || cartItems[0]?.title || "Điểm đến đã chọn";
        localStorage.setItem("bookingStepData", JSON.stringify({
            checkInDate, checkOutDate, location,
            subtotal: Math.round(subtotal),
            vat:      Math.round(tax),
            total:    Math.round(total),
        }));
        navigate("/payment");
    };

    return (
        <div className="cp-root">
            <div className="container">
                <div className="cp-header">
                    <h2 className="cp-title">Thông tin đặt dịch vụ</h2>
                    <p className="cp-breadcrumb">
                        <Link to="/">Trang chủ</Link> / Thông tin
                    </p>
                    <StepBar current={1} />
                </div>

                <div className="cp-body">
                    {/* Form */}
                    <div className="cp-items-col">
                        <h3 className="cp-section-title">
                            <i className="bi bi-person-lines-fill me-2"></i>Thông tin liên hệ
                        </h3>

                        <div className="cp-info-grid">
                            {/* Full name */}
                            <div className="cp-field cp-field-full">
                                <label className="cp-field-label">Họ và tên <span className="cp-required">*</span></label>
                                <div className="cp-input-wrap">
                                    <i className="bi bi-person cp-input-icon"></i>
                                    <input name="fullName" type="text" className="cp-input"
                                        placeholder="Nguyễn Văn A"
                                        value={form.fullName} onChange={onChange} />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="cp-field">
                                <label className="cp-field-label">Email <span className="cp-required">*</span></label>
                                <div className="cp-input-wrap">
                                    <i className="bi bi-envelope cp-input-icon"></i>
                                    <input name="email" type="email" className="cp-input"
                                        placeholder="you@email.com"
                                        value={form.email} onChange={onChange} />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="cp-field">
                                <label className="cp-field-label">Số điện thoại <span className="cp-required">*</span></label>
                                <div className="cp-input-wrap">
                                    <i className="bi bi-telephone cp-input-icon"></i>
                                    <input name="phone" type="tel" className="cp-input"
                                        placeholder="+84 xxx xxx xxx"
                                        value={form.phone} onChange={onChange} />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="cp-field cp-field-full" style={{ marginTop: 4 }}>
                                <label className="cp-field-label">
                                    Ghi chú <span className="cp-optional">(Tùy chọn)</span>
                                </label>
                                <textarea name="notes" rows={3} className="cp-input cp-textarea"
                                    placeholder="Yêu cầu đặc biệt, dị ứng thực phẩm, giờ đến..."
                                    value={form.notes} onChange={onChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="cp-summary-col">
                        <div className="cp-summary-card">
                            <h3 className="cp-summary-title">Tóm tắt dịch vụ</h3>

                            {/* Date range */}
                            <div className="cp-daterange">
                                <div className="cp-daterange-side" onClick={() => checkInRef.current?.showPicker?.()}>
                                    <span className="cp-daterange-label">
                                        <i className="bi bi-calendar-check"></i> Ngày đến
                                    </span>
                                    <span className="cp-daterange-val">{fmt(checkInDate)}</span>
                                    <input type="date" ref={checkInRef}
                                        value={checkInDate}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={e => { setCheckInDate(e.target.value); setTimeout(() => checkOutRef.current?.showPicker?.(), 80); }}
                                        className="cp-daterange-input" />
                                </div>
                                <div className="cp-daterange-sep"><i className="bi bi-arrow-right"></i></div>
                                <div className="cp-daterange-side" onClick={() => checkOutRef.current?.showPicker?.()}>
                                    <span className="cp-daterange-label">
                                        <i className="bi bi-calendar-x"></i> Ngày về
                                    </span>
                                    <span className="cp-daterange-val">{fmt(checkOutDate)}</span>
                                    <input type="date" ref={checkOutRef}
                                        value={checkOutDate}
                                        min={checkInDate || new Date().toISOString().split("T")[0]}
                                        onChange={e => setCheckOutDate(e.target.value)}
                                        className="cp-daterange-input" />
                                </div>
                            </div>

                            {/* Items summary */}
                            {cartItems.length > 0 && (
                                <div className="cp-mini-items">
                                    {cartItems.map(it => (
                                        <div key={it.id} className="cp-mini-item">
                                            <span className="cp-mini-name">{it.title || it.name || "Dịch vụ"}</span>
                                            <span className="cp-mini-price">
                                                {fmtVND((parseFloat(it.price) || 0) * (it.quantity || 1))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="cp-price-rows">
                                <div className="cp-price-row">
                                    <span>Tạm tính</span>
                                    <span>{fmtVND(subtotal)}</span>
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

                            <button
                                className="cp-continue-btn"
                                onClick={handleContinue}
                                disabled={!canContinue}
                            >
                                Tiếp tục <i className="bi bi-arrow-right ms-2"></i>
                            </button>

                            <div className="cp-guarantee">
                                <i className="bi bi-shield-check text-success me-2"></i>
                                Miễn phí hủy trước 24 giờ
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
