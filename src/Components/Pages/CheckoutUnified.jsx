import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { saveOrder } from "../../lib/authStorage";

/* ─── helpers ────────────────────────────────────────── */
const fmtVND = n => Math.round(n).toLocaleString("vi-VN") + " ₫";

const fmtDate = d => {
    if (!d) return null;
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
};

const MONTH_NAMES = [
    "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
    "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];
const DAY_NAMES = ["T2","T3","T4","T5","T6","T7","CN"];

/* ─── payment data ───────────────────────────────────── */
const VN_METHODS = [
    { id: "vnpay",   label: "VNPay",        sub: "Quét mã QR / ATM nội địa", icon: "bi-qr-code-scan", color: "#e3000e", bg: "rgba(227,0,14,0.12)"   },
    { id: "momo",    label: "MoMo",         sub: "Ví điện tử MoMo",           icon: "bi-phone-fill",   color: "#ae2070", bg: "rgba(174,32,112,0.12)" },
    { id: "zalopay", label: "ZaloPay",      sub: "Ví ZaloPay / Zalo",         icon: "bi-wallet2",      color: "#0068ff", bg: "rgba(0,104,255,0.10)"  },
    { id: "banking", label: "Chuyển khoản", sub: "Internet Banking",           icon: "bi-bank2",        color: "#017b6e", bg: "rgba(1,123,110,0.12)"  },
];

/* detect card type from number */
const detectCardType = num => {
    const n = (num || "").replace(/\s/g, "");
    if (n.startsWith("4"))        return { label: "Visa",       color: "#1a1f71", grad: "linear-gradient(135deg,#1a1f71 0%,#2d3693 100%)" };
    if (/^5[1-5]/.test(n))       return { label: "Mastercard", color: "#eb001b", grad: "linear-gradient(135deg,#eb001b 0%,#f79e1b 100%)" };
    if (/^3[47]/.test(n))        return { label: "Amex",       color: "#007bc0", grad: "linear-gradient(135deg,#007bc0 0%,#00aee5 100%)" };
    return { label: "",           color: "#2d3a52", grad: "linear-gradient(135deg,#1e2438 0%,#2d3a52 100%)" };
};

/* ─── section header ─────────────────────────────────── */
const SectionHead = ({ num, title, icon }) => (
    <div className="cu-section-head">
        <div className="cu-section-num">{num}</div>
        <i className={`bi ${icon} cu-section-icon`}></i>
        <h3 className="cu-section-title">{title}</h3>
    </div>
);

/* ══════════════════════════════════════════════════════ */
const CheckoutUnified = () => {
    const navigate        = useNavigate();
    const { currentUser } = useAuth();

    /* booking item */
    const [item, setItem] = useState(null);

    /* contact form */
    const [form, setForm] = useState({ fullName: "", email: "", phone: "", notes: "" });

    /* ── calendar state ── */
    const [dateFrom,     setDateFrom]     = useState("");
    const [dateTo,       setDateTo]       = useState("");
    const [hoverDate,    setHoverDate]    = useState("");
    const [calOpen,      setCalOpen]      = useState(false);
    const [viewYear,     setViewYear]     = useState(new Date().getFullYear());
    const [viewMonth,    setViewMonth]    = useState(new Date().getMonth());
    const calWrapRef = useRef(null);

    /* payment */
    const [payTab,     setPayTab]     = useState("card");
    const [vnMethod,   setVnMethod]   = useState("vnpay");
    const [intlMethod, setIntlMethod] = useState("paypal");
    const [card,  setCard]  = useState({ name: "", number: "", expiry: "", cvv: "" });
    const [agreed,   setAgreed]   = useState(false);
    const [paying,   setPaying]   = useState(false);
    const [payError, setPayError] = useState("");

    /* ── init ── */
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("bookingItem") || "null");
        setItem(stored);
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

    /* close calendar on outside click */
    useEffect(() => {
        const handler = e => {
            if (calWrapRef.current && !calWrapRef.current.contains(e.target)) {
                setCalOpen(false);
                setHoverDate("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ── calendar logic ── */
    const month2 = viewMonth === 11 ? 0  : viewMonth + 1;
    const year2  = viewMonth === 11 ? viewYear + 1 : viewYear;

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const handleDateClick = ds => {
        if (!dateFrom || (dateFrom && dateTo)) {
            setDateFrom(ds); setDateTo(""); setHoverDate("");
        } else {
            if (ds > dateFrom) {
                setDateTo(ds); setHoverDate(""); setCalOpen(false);
            } else {
                setDateFrom(ds); setDateTo(""); setHoverDate("");
            }
        }
    };

    const renderMonth = (year, month) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay    = (new Date(year, month, 1).getDay() + 6) % 7;
        const todayDt     = new Date(); todayDt.setHours(0, 0, 0, 0);
        const effectiveTo = dateTo || hoverDate;
        const cells = [
            ...Array(firstDay).fill(null),
            ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ];
        return (
            <div className="cal-month" key={`${year}-${month}`}>
                <div className="cal-month-title">{MONTH_NAMES[month]} {year}</div>
                <div className="cal-week-header">
                    {DAY_NAMES.map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="cal-grid">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={idx} className="cal-cell empty" />;
                        const ds      = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                        const dt      = new Date(ds + "T00:00:00");
                        const isPast  = dt < todayDt;
                        const isStart = ds === dateFrom;
                        const isEnd   = ds === dateTo;
                        const inRange = dateFrom && effectiveTo && ds > dateFrom && ds < effectiveTo;
                        const isToday = dt.getTime() === todayDt.getTime();
                        const isHover = ds === hoverDate && !dateTo;
                        const cls = ["cal-cell",
                            isPast  ? "cal-past"  : "",
                            isStart ? "cal-start" : "",
                            isEnd   ? "cal-end"   : "",
                            inRange ? "cal-range" : "",
                            isToday ? "cal-today" : "",
                            isHover ? "cal-hover" : "",
                        ].filter(Boolean).join(" ");
                        return (
                            <div key={idx} className={cls}
                                onClick={() => !isPast && handleDateClick(ds)}
                                onMouseEnter={() => !isPast && dateFrom && !dateTo && setHoverDate(ds)}
                                onMouseLeave={() => setHoverDate("")}
                            >{day}</div>
                        );
                    })}
                </div>
            </div>
        );
    };

    /* ── pricing ── */
    const rawPrice = parseFloat(item?.price || 0) * (item?.quantity || 1);
    const subtotal = Math.round(rawPrice / 1.1);
    const tax      = rawPrice - subtotal;
    const total    = rawPrice;

    /* ── form handlers ── */
    const onForm = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const onCard = e => {
        let { name, value } = e.target;
        if (name === "number") value = value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
        if (name === "expiry") value = value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
        if (name === "cvv")    value = value.replace(/\D/g, "").slice(0, 4);
        setCard(p => ({ ...p, [name]: value }));
    };

    const cardOk = payTab !== "card" || (
        card.name.trim() &&
        card.number.replace(/\s/g, "").length === 16 &&
        card.expiry.length === 5 &&
        card.cvv.length >= 3
    );
    const canPay = agreed && form.fullName.trim() && form.email.trim() && form.phone.trim() && cardOk;

    const handlePay = async () => {
        if (paying || !canPay) return;
        setPaying(true); setPayError("");
        try {
            if (currentUser) {
                await saveOrder({
                    userId:        currentUser.id,
                    userName:      form.fullName || currentUser.fullName,
                    userEmail:     form.email    || currentUser.email,
                    location:      item?.location || "Điểm đến đã chọn",
                    date:          dateFrom,
                    checkOut:      dateTo,
                    subTotal:      Math.round(subtotal),
                    tax:           Math.round(tax),
                    total:         Math.round(total),
                    paymentTab:    payTab,
                    paymentMethod: payTab === "card" ? "card" : payTab === "vn" ? vnMethod : intlMethod,
                    items:         item ? [{ name: item.title || "Dịch vụ", price: item.price }] : [],
                });
            }
            localStorage.removeItem("bookingItem");
            navigate("/Tour_Booking_Summery", {
                state: {
                    date:          dateFrom,
                    checkOut:      dateTo,
                    location:      item?.location || "Điểm đến đã chọn",
                    subTotal:      Math.round(subtotal),
                    tax:           Math.round(tax),
                    total:         Math.round(total),
                    customerName:  form.fullName || currentUser?.fullName || "",
                    customerEmail: form.email    || currentUser?.email    || "",
                },
            });
        } catch (err) {
            setPayError("Lưu đơn hàng thất bại: " + (err.message || "Vui lòng thử lại."));
        } finally {
            setPaying(false);
        }
    };

    /* ── date display helpers ── */
    const dateFromFmt = fmtDate(dateFrom);
    const dateToFmt   = fmtDate(dateTo);

    /* ════════════════════ RENDER ════════════════════ */
    return (
        <div className="cu-root">
            <div className="container">

                {/* ── Page header ── */}
                <div className="cu-header">
                    <h1 className="cu-title">Đặt dịch vụ &amp; Thanh toán</h1>
                    <nav className="cu-breadcrumb">
                        <Link to="/">Trang chủ</Link>
                        <i className="bi bi-chevron-right"></i>
                        <span>Thanh toán</span>
                    </nav>
                </div>

                <div className="cu-body">

                    {/* ════════ LEFT ════════ */}
                    <div className="cu-main">

                        {/* ── 1. Contact info ── */}
                        <div className="cu-card">
                            <SectionHead num="1" icon="bi-person-lines-fill" title="Thông tin liên hệ" />
                            <div className="cu-grid2">
                                <div className="cu-field cu-full">
                                    <label className="cu-label">Họ và tên <span className="cu-req">*</span></label>
                                    <div className="cu-wrap">
                                        <i className="bi bi-person cu-ico"></i>
                                        <input name="fullName" type="text" className="cu-input"
                                            placeholder="Nguyễn Văn A"
                                            value={form.fullName} onChange={onForm} />
                                    </div>
                                </div>
                                <div className="cu-field">
                                    <label className="cu-label">Email <span className="cu-req">*</span></label>
                                    <div className="cu-wrap">
                                        <i className="bi bi-envelope cu-ico"></i>
                                        <input name="email" type="email" className="cu-input"
                                            placeholder="you@email.com"
                                            value={form.email} onChange={onForm} />
                                    </div>
                                </div>
                                <div className="cu-field">
                                    <label className="cu-label">Số điện thoại <span className="cu-req">*</span></label>
                                    <div className="cu-wrap">
                                        <i className="bi bi-telephone cu-ico"></i>
                                        <input name="phone" type="tel" className="cu-input"
                                            placeholder="+84 xxx xxx xxx"
                                            value={form.phone} onChange={onForm} />
                                    </div>
                                </div>
                                <div className="cu-field cu-full">
                                    <label className="cu-label">Ghi chú <span className="cu-opt">(Tùy chọn)</span></label>
                                    <textarea name="notes" rows={2} className="cu-input cu-textarea"
                                        placeholder="Yêu cầu đặc biệt, dị ứng thực phẩm, giờ đến..."
                                        value={form.notes} onChange={onForm} />
                                </div>
                            </div>
                        </div>

                        {/* ── 2. Date picker (dual-month calendar) ── */}
                        <div className="cu-card cu-card-date">
                            <SectionHead num="2" icon="bi-calendar3" title="Ngày dịch vụ" />

                            {/* Trigger row */}
                            <div className="cu-cal-trigger-row" ref={calWrapRef}>
                                <button
                                    type="button"
                                    className={`cu-cal-trigger ${calOpen ? "cu-cal-trigger-open" : ""}`}
                                    onClick={() => setCalOpen(o => !o)}
                                >
                                    {/* Check-in */}
                                    <div className="cu-cal-half">
                                        <i className="bi bi-calendar-check cu-cal-ico"></i>
                                        <div className="cu-cal-texts">
                                            <span className="cu-cal-label">NGÀY ĐẾN</span>
                                            <span className={`cu-cal-val ${!dateFromFmt ? "cu-cal-placeholder" : ""}`}>
                                                {dateFromFmt || "Chọn ngày"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="cu-cal-arrow">
                                        <i className="bi bi-arrow-right"></i>
                                    </div>

                                    {/* Check-out */}
                                    <div className="cu-cal-half">
                                        <i className="bi bi-calendar-x cu-cal-ico"></i>
                                        <div className="cu-cal-texts">
                                            <span className="cu-cal-label">NGÀY VỀ</span>
                                            <span className={`cu-cal-val ${!dateToFmt ? "cu-cal-placeholder" : ""}`}>
                                                {dateToFmt || (dateFromFmt ? "Chọn ngày về" : "Chọn ngày")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Clear button */}
                                    {(dateFrom || dateTo) && (
                                        <button
                                            type="button"
                                            className="cu-cal-clear"
                                            onClick={e => { e.stopPropagation(); setDateFrom(""); setDateTo(""); }}
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    )}
                                </button>

                                {/* Calendar popup */}
                                {calOpen && (
                                    <div className="cu-cal-popup">
                                        <div className="cal-nav">
                                            <button className="cal-arrow" onClick={prevMonth}>
                                                <i className="bi bi-chevron-left"></i>
                                            </button>
                                            <div className="cal-months-wrap">
                                                {renderMonth(viewYear, viewMonth)}
                                                {renderMonth(year2, month2)}
                                            </div>
                                            <button className="cal-arrow" onClick={nextMonth}>
                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                        </div>
                                        <p className="cal-hint">
                                            {!dateFrom
                                                ? "Chọn ngày đến"
                                                : !dateTo
                                                    ? "Chọn ngày về"
                                                    : `${dateFromFmt} → ${dateToFmt}`}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Selected range summary (shown when both picked) */}
                            {dateFrom && dateTo && (
                                <div className="cu-date-summary">
                                    <i className="bi bi-check-circle-fill" style={{ color: "#22c55e" }}></i>
                                    <span>
                                        Đã chọn: <strong>{dateFromFmt}</strong>
                                        {" "}→{" "}
                                        <strong>{dateToFmt}</strong>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ── 3. Payment ── */}
                        <div className="cu-card">
                            <SectionHead num="3" icon="bi-wallet2" title="Phương thức thanh toán" />

                            {/* ── Tab switcher ── */}
                            <div className="pf-tabs">
                                {[
                                    { id: "card", label: "Thẻ ngân hàng", icon: "bi-credit-card-2-front" },
                                    { id: "vn",   label: "Ví điện tử",    icon: "bi-phone-fill"          },
                                    { id: "intl", label: "Quốc tế",       icon: "bi-globe2"               },
                                ].map(t => (
                                    <button key={t.id}
                                        className={`pf-tab ${payTab === t.id ? "pf-tab-on" : ""}`}
                                        onClick={() => setPayTab(t.id)}>
                                        <i className={`bi ${t.icon}`}></i>
                                        <span>{t.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* ══════ TAB: Thẻ ngân hàng ══════ */}
                            {payTab === "card" && (() => {
                                const ct = detectCardType(card.number);
                                const displayNum = card.number
                                    ? card.number.padEnd(19, " ").replace(/ {1}/g, "•").slice(0,19)
                                    : "•••• •••• •••• ••••";
                                return (
                                    <div className="pf-card-tab">
                                        {/* Visual card preview */}
                                        <div className="pf-card-preview" style={{ background: ct.grad }}>
                                            {/* chip */}
                                            <div className="pf-chip">
                                                <div className="pf-chip-inner" />
                                            </div>
                                            {/* card number */}
                                            <div className="pf-preview-number">
                                                {displayNum}
                                            </div>
                                            {/* bottom row */}
                                            <div className="pf-preview-row">
                                                <div>
                                                    <div className="pf-preview-label">Chủ thẻ</div>
                                                    <div className="pf-preview-val">
                                                        {card.name ? card.name.toUpperCase() : "TÊN CHỦ THẺ"}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div className="pf-preview-label">Hết hạn</div>
                                                    <div className="pf-preview-val">{card.expiry || "MM/YY"}</div>
                                                </div>
                                                {ct.label && (
                                                    <div className="pf-preview-brand">{ct.label}</div>
                                                )}
                                            </div>
                                            {/* decorative circles */}
                                            <div className="pf-deco-circle pf-deco-1" />
                                            <div className="pf-deco-circle pf-deco-2" />
                                        </div>

                                        {/* Inputs */}
                                        <div className="cu-grid2" style={{ marginTop: 20 }}>
                                            <div className="cu-field cu-full">
                                                <label className="cu-label">Số thẻ</label>
                                                <div className="cu-wrap">
                                                    <i className="bi bi-credit-card cu-ico"></i>
                                                    <input name="number" className="cu-input"
                                                        placeholder="1234 5678 9012 3456"
                                                        value={card.number} onChange={onCard}
                                                        autoComplete="cc-number" inputMode="numeric" />
                                                </div>
                                            </div>
                                            <div className="cu-field cu-full">
                                                <label className="cu-label">Tên chủ thẻ</label>
                                                <div className="cu-wrap">
                                                    <i className="bi bi-person cu-ico"></i>
                                                    <input name="name" className="cu-input"
                                                        placeholder="NGUYEN VAN A"
                                                        value={card.name} onChange={onCard}
                                                        autoComplete="cc-name" />
                                                </div>
                                            </div>
                                            <div className="cu-field">
                                                <label className="cu-label">Ngày hết hạn</label>
                                                <div className="cu-wrap">
                                                    <i className="bi bi-calendar-event cu-ico"></i>
                                                    <input name="expiry" className="cu-input"
                                                        placeholder="MM/YY"
                                                        value={card.expiry} onChange={onCard}
                                                        autoComplete="cc-exp" inputMode="numeric" />
                                                </div>
                                            </div>
                                            <div className="cu-field">
                                                <label className="cu-label">
                                                    Mã CVV
                                                    <span className="pf-cvv-hint" title="3 hoặc 4 số ở mặt sau thẻ">?</span>
                                                </label>
                                                <div className="cu-wrap">
                                                    <i className="bi bi-shield-lock cu-ico"></i>
                                                    <input name="cvv" type="password" className="cu-input"
                                                        placeholder="•••" maxLength={4}
                                                        value={card.cvv} onChange={onCard}
                                                        autoComplete="cc-csc" inputMode="numeric" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pf-ssl-row">
                                            <span className="pf-ssl-badge">
                                                <i className="bi bi-lock-fill"></i> SSL 256-bit
                                            </span>
                                            <span className="pf-ssl-badge">
                                                <i className="bi bi-shield-check"></i> PCI DSS
                                            </span>
                                            <span className="pf-ssl-badge">
                                                <i className="bi bi-eye-slash"></i> Không lưu trữ
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ══════ TAB: Ví điện tử ══════ */}
                            {payTab === "vn" && (
                                <div className="pf-wallet-section">
                                    <div className="pf-wallet-grid">
                                        {VN_METHODS.map(m => (
                                            <button key={m.id}
                                                className={`pf-wallet-btn ${vnMethod === m.id ? "pf-wallet-on" : ""}`}
                                                onClick={() => setVnMethod(m.id)}
                                                style={{ "--wc": m.color, "--wbg": m.bg }}>
                                                <div className="pf-wallet-ico" style={{ background: m.bg, color: m.color }}>
                                                    <i className={`bi ${m.icon}`}></i>
                                                </div>
                                                <div className="pf-wallet-texts">
                                                    <span className="pf-wallet-name">{m.label}</span>
                                                    <span className="pf-wallet-sub">{m.sub}</span>
                                                </div>
                                                {vnMethod === m.id
                                                    ? <i className="bi bi-check-circle-fill pf-wallet-check" style={{ color: m.color }}></i>
                                                    : <i className="bi bi-chevron-right pf-wallet-arrow"></i>
                                                }
                                            </button>
                                        ))}
                                    </div>
                                    <div className="pf-redirect-info">
                                        <i className="bi bi-box-arrow-up-right"></i>
                                        Sau khi xác nhận, bạn sẽ được chuyển đến trang{" "}
                                        <strong>{VN_METHODS.find(m => m.id === vnMethod)?.label}</strong>{" "}
                                        để hoàn tất thanh toán an toàn
                                    </div>
                                </div>
                            )}

                            {/* ══════ TAB: Quốc tế ══════ */}
                            {payTab === "intl" && (
                                <div className="pf-intl-section">
                                    {/* PayPal */}
                                    <button
                                        className={`pf-paypal-btn ${intlMethod === "paypal" ? "pf-paypal-on" : ""}`}
                                        onClick={() => setIntlMethod("paypal")}>
                                        <i className="bi bi-paypal"></i>
                                        <span>Thanh toán qua <strong>PayPal</strong></span>
                                        {intlMethod === "paypal" && <i className="bi bi-check-circle-fill pf-intl-check"></i>}
                                    </button>

                                    {/* Or divider */}
                                    <div className="pf-or">
                                        <span>hoặc thanh toán bằng thẻ quốc tế</span>
                                    </div>

                                    {/* Visa / Mastercard */}
                                    <div className="pf-intl-cards">
                                        {[
                                            { id: "visa",       label: "Visa",       icon: "bi-credit-card-2-front", grad: "linear-gradient(135deg,#1a1f71,#2d3693)" },
                                            { id: "mastercard", label: "Mastercard", icon: "bi-credit-card-fill",    grad: "linear-gradient(135deg,#eb001b,#f79e1b)"  },
                                        ].map(c => (
                                            <button key={c.id}
                                                className={`pf-intl-card ${intlMethod === c.id ? "pf-intl-card-on" : ""}`}
                                                onClick={() => setIntlMethod(c.id)}>
                                                <div className="pf-intl-card-logo" style={{ background: c.grad }}>
                                                    <i className={`bi ${c.icon}`}></i>
                                                </div>
                                                <span>{c.label}</span>
                                                {intlMethod === c.id && <i className="bi bi-check-circle-fill pf-intl-check"></i>}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pf-redirect-info">
                                        <i className="bi bi-box-arrow-up-right"></i>
                                        {intlMethod === "paypal"
                                            ? "Bạn sẽ được chuyển đến PayPal để thanh toán an toàn"
                                            : "Điền thông tin thẻ trên cổng thanh toán quốc tế bảo mật"}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Submit ── */}
                        <div className="cu-submit-area">
                            {payError && (
                                <div className="cu-error">
                                    <i className="bi bi-exclamation-triangle-fill"></i> {payError}
                                </div>
                            )}
                            <label className="cu-agree">
                                <input type="checkbox" className="af-checkbox"
                                    checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                                <span>
                                    Tôi đồng ý với{" "}
                                    <a href="#" className="cu-link">Điều khoản dịch vụ</a>
                                    {" "}và{" "}
                                    <a href="#" className="cu-link">Chính sách bảo mật</a>
                                </span>
                            </label>

                            <button className="cu-pay-btn" onClick={handlePay} disabled={!canPay || paying}>
                                {paying
                                    ? <><span className="af-spinner"></span> Đang xử lý...</>
                                    : <><i className="bi bi-lock-fill"></i>{" "}
                                      {total > 0 ? `Thanh toán ${fmtVND(total)}` : "Xác nhận đặt dịch vụ"}</>
                                }
                            </button>

                            <p className="cu-ssl">
                                <i className="bi bi-shield-check"></i>
                                Giao dịch mã hóa SSL 256-bit · An toàn tuyệt đối
                            </p>
                        </div>
                    </div>

                    {/* ════════ RIGHT: Sticky summary ════════ */}
                    <div className="cu-sidebar">
                        <div className="cu-summary">

                            {/* Service info */}
                            {item && (
                                <div className="cu-svc">
                                    {item.image && (
                                        <img src={item.image} alt={item.title} className="cu-svc-img" />
                                    )}
                                    <div className="cu-svc-info">
                                        <p className="cu-svc-name">{item.title || item.name || "Dịch vụ"}</p>
                                        {item.location && (
                                            <p className="cu-svc-loc">
                                                <i className="bi bi-geo-alt-fill"></i> {item.location}
                                            </p>
                                        )}
                                        {item.quantity > 1 && (
                                            <p className="cu-svc-qty">× {item.quantity} khách</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Price breakdown */}
                            <div className="cu-prices">
                                <div className="cu-price-row">
                                    <span>Tạm tính</span>
                                    <span>{fmtVND(subtotal)}</span>
                                </div>
                                <div className="cu-price-row">
                                    <span>Thuế &amp; phí (10%)</span>
                                    <span>{fmtVND(tax)}</span>
                                </div>
                                <div className="cu-price-total">
                                    <span>Tổng cộng</span>
                                    <span className="cu-total-num">{fmtVND(total)}</span>
                                </div>
                            </div>

                            {/* Trust row */}
                            <div className="cu-trust">
                                <div className="cu-trust-item">
                                    <i className="bi bi-shield-check"></i>
                                    <span>Bảo mật SSL</span>
                                </div>
                                <div className="cu-trust-item">
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                    <span>Hoàn tiền 24h</span>
                                </div>
                                <div className="cu-trust-item">
                                    <i className="bi bi-headset"></i>
                                    <span>Hỗ trợ 24/7</span>
                                </div>
                            </div>

                            {/* Accepted payments */}
                            <div className="cu-accepted">
                                <i className="bi bi-paypal" title="PayPal"></i>
                                <i className="bi bi-credit-card-2-front" title="Visa"></i>
                                <i className="bi bi-credit-card-fill" title="Mastercard"></i>
                                <i className="bi bi-bank" title="Nội địa"></i>
                                <i className="bi bi-qr-code" title="VNPay"></i>
                            </div>

                            {/* Guarantee */}
                            <div className="cu-guarantee">
                                <i className="bi bi-shield-check text-success"></i>
                                Miễn phí hủy trước 24 giờ
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CheckoutUnified;
