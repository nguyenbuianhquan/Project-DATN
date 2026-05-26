import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { saveOrder } from "../../lib/authStorage";
import { api } from "../../lib/api";

/* ─── helpers ─────────────────────────────────────────── */
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

/* ─── simulated coupon codes ──────────────────────────── */
const COUPONS = {
    "DAYTRIP10": { type: "percent", value: 10, label: "Giảm 10% tổng đơn"    },
    "SAVE50K":   { type: "fixed",   value: 50000, label: "Giảm 50,000 ₫"     },
    "SUMMER20":  { type: "percent", value: 20, label: "Giảm 20% mùa hè"      },
    "WELCOME":   { type: "percent", value: 5,  label: "Ưu đãi chào mừng -5%" },
};

/* ─── online payment methods ─────────────────────────── */
const ONLINE_METHODS = [
    { id: "card",  label: "Thẻ tín dụng / Ghi nợ", sub: "Visa · Mastercard · JCB", icon: "bi-credit-card-2-front" },
    { id: "momo",  label: "Ví MoMo",                sub: "Quét QR / số điện thoại", icon: "bi-phone-fill"          },
    { id: "vnpay", label: "VNPay",                   sub: "QR Code / ATM nội địa",   icon: "bi-qr-code-scan"        },
];

/* ─── detect card brand ───────────────────────────────── */
const detectCardType = num => {
    const n = (num || "").replace(/\s/g, "");
    if (n.startsWith("4"))  return { label: "Visa",       grad: "linear-gradient(135deg,#1a1f71 0%,#2d3693 100%)" };
    if (/^5[1-5]/.test(n)) return { label: "Mastercard", grad: "linear-gradient(135deg,#eb001b 0%,#f79e1b 100%)" };
    if (/^3[47]/.test(n))  return { label: "Amex",       grad: "linear-gradient(135deg,#007bc0 0%,#00aee5 100%)" };
    return                        { label: "",             grad: "linear-gradient(135deg,#1e2438 0%,#2d3a52 100%)" };
};

/* ─── countdown hook ──────────────────────────────────── */
const useCountdown = (totalSec) => {
    const [rem, setRem] = useState(totalSec);
    useEffect(() => {
        if (rem <= 0) return;
        const id = setInterval(() => setRem(r => Math.max(0, r - 1)), 1000);
        return () => clearInterval(id);
    }, [rem]);
    return {
        rem,
        min: String(Math.floor(rem / 60)).padStart(2, "0"),
        sec: String(rem % 60).padStart(2, "0"),
        expired: rem === 0,
        warn: rem < 120,
    };
};

/* ─── section header ──────────────────────────────────── */
const SectionHead = ({ num, title, icon }) => (
    <div className="cu-section-head">
        <div className="cu-section-num">{num}</div>
        <i className={`bi ${icon} cu-section-icon`}></i>
        <h3 className="cu-section-title">{title}</h3>
    </div>
);

/* ════════════════════════════════════════════════════════
   CheckoutUnified — Professional Booking Flow
════════════════════════════════════════════════════════ */
const CheckoutUnified = () => {
    const navigate        = useNavigate();
    const { currentUser } = useAuth();

    /* booking item from localStorage */
    const [item, setItem] = useState(null);

    /* auto booking ID */
    const [bookingId] = useState(() => "DT" + Date.now().toString(36).toUpperCase().slice(-6));

    /* contact form */
    const [form, setForm] = useState({ fullName: "", email: "", phone: "", notes: "" });

    /* calendar */
    const [dateFrom,  setDateFrom]  = useState("");
    const [dateTo,    setDateTo]    = useState("");
    const [hoverDate, setHoverDate] = useState("");
    const [calOpen,   setCalOpen]   = useState(false);
    const [viewYear,  setViewYear]  = useState(new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const calWrapRef = useRef(null);

    /* payment */
    const [payMode,      setPayMode]      = useState("online"); // online | at_property | deposit
    const [onlineMethod, setOnlineMethod] = useState("card");
    const [card,         setCard]         = useState({ name: "", number: "", expiry: "", cvv: "" });

    /* coupon */
    const [couponCode,    setCouponCode]    = useState("");
    const [coupon,        setCoupon]        = useState(null);
    const [couponErr,     setCouponErr]     = useState("");
    const [couponLoading, setCouponLoading] = useState(false);

    /* submit */
    const [agreed,   setAgreed]   = useState(false);
    const [paying,   setPaying]   = useState(false);
    const [payError, setPayError] = useState("");

    /* 10-min countdown */
    const cd = useCountdown(600);

    /* ── init ── */
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("bookingItem") || "null");
        setItem(stored);
        // Pre-fill dates from bookingItem (set by HotelRoomSelect / Cart)
        if (stored?.date)     setDateFrom(stored.date);
        if (stored?.checkOut) setDateTo(stored.checkOut);
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

    /* calendar outside click */
    useEffect(() => {
        const h = e => {
            if (calWrapRef.current && !calWrapRef.current.contains(e.target)) {
                setCalOpen(false); setHoverDate("");
            }
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    /* ── calendar logic ── */
    const month2 = viewMonth === 11 ? 0          : viewMonth + 1;
    const year2  = viewMonth === 11 ? viewYear+1 : viewYear;

    const prevMonth = () => { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
    const nextMonth = () => { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };

    const handleDateClick = ds => {
        if (!dateFrom || (dateFrom && dateTo)) { setDateFrom(ds); setDateTo(""); setHoverDate(""); }
        else { if (ds>dateFrom){setDateTo(ds);setHoverDate("");setCalOpen(false);}else{setDateFrom(ds);setDateTo("");setHoverDate("");} }
    };

    const renderMonth = (year, month) => {
        const dim     = new Date(year, month+1, 0).getDate();
        const first   = (new Date(year, month, 1).getDay()+6)%7;
        const todayDt = new Date(); todayDt.setHours(0,0,0,0);
        const effTo   = dateTo || hoverDate;
        const cells   = [...Array(first).fill(null), ...Array.from({length:dim},(_,i)=>i+1)];
        return (
            <div className="cal-month" key={`${year}-${month}`}>
                <div className="cal-month-title">{MONTH_NAMES[month]} {year}</div>
                <div className="cal-week-header">{DAY_NAMES.map(d=><span key={d}>{d}</span>)}</div>
                <div className="cal-grid">
                    {cells.map((day,idx)=>{
                        if(!day) return <div key={idx} className="cal-cell empty"/>;
                        const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                        const dt=new Date(ds+"T00:00:00");
                        const cls=["cal-cell",
                            dt<todayDt?"cal-past":"",
                            ds===dateFrom?"cal-start":"",
                            ds===dateTo?"cal-end":"",
                            (dateFrom&&effTo&&ds>dateFrom&&ds<effTo)?"cal-range":"",
                            dt.getTime()===todayDt.getTime()?"cal-today":"",
                            (ds===hoverDate&&!dateTo)?"cal-hover":"",
                        ].filter(Boolean).join(" ");
                        return (
                            <div key={idx} className={cls}
                                onClick={()=>dt>=todayDt&&handleDateClick(ds)}
                                onMouseEnter={()=>dt>=todayDt&&dateFrom&&!dateTo&&setHoverDate(ds)}
                                onMouseLeave={()=>setHoverDate("")}
                            >{day}</div>
                        );
                    })}
                </div>
            </div>
        );
    };

    /* ── pricing ── */
    const rawPrice       = parseFloat(item?.price||0) * (item?.quantity||1);
    const subtotal       = Math.round(rawPrice/1.1);
    const tax            = rawPrice - subtotal;
    const total          = rawPrice;
    const discount       = coupon?.discount || 0;
    const discountedTotal = Math.max(0, total - discount);
    const depositAmount  = Math.round(discountedTotal * 0.3);
    const remainingAmt   = discountedTotal - depositAmount;
    const payableNow     = payMode==="deposit" ? depositAmount
                         : payMode==="at_property" ? 0
                         : discountedTotal;

    /* ── coupon — gọi API thật ── */
    const applyCoupon = async () => {
        const key = couponCode.trim().toUpperCase();
        if (!key) { setCouponErr("Vui lòng nhập mã giảm giá"); return; }
        setCouponLoading(true);
        try {
            const data = await api.post("/coupons/apply", { code: key, totalPrice: total });
            setCoupon({ label: data.label, discount: data.discount });
            setCouponErr("");
        } catch (err) {
            setCouponErr(err.message || "Mã không hợp lệ hoặc đã hết hạn");
            setCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };
    const removeCoupon = () => { setCoupon(null); setCouponCode(""); setCouponErr(""); };

    /* ── form handlers ── */
    const onForm = e => setForm(p=>({...p,[e.target.name]:e.target.value}));
    const onCard = e => {
        let {name,value} = e.target;
        if(name==="number") value=value.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
        if(name==="expiry") value=value.replace(/\D/g,"").slice(0,4).replace(/^(\d{2})(\d)/,"$1/$2");
        if(name==="cvv")    value=value.replace(/\D/g,"").slice(0,4);
        setCard(p=>({...p,[name]:value}));
    };

    /* ── validation ── */
    const needsCard = (payMode==="online"||payMode==="deposit") && onlineMethod==="card";
    const cardOk    = !needsCard || (
        card.name.trim() && card.number.replace(/\s/g,"").length===16 &&
        card.expiry.length===5 && card.cvv.length>=3
    );
    const canPay = agreed && form.fullName.trim() && form.email.trim() && form.phone.trim() && cardOk;

    /* ── submit ── */
    const handlePay = async () => {
        if (paying||!canPay) return;
        setPaying(true); setPayError("");
        try {
            await saveOrder({
                // thông tin khách hàng
                userName:       form.fullName,
                userEmail:      form.email,
                phone:          form.phone,
                notes:          form.notes,
                specialRequest: form.notes,

                // dịch vụ
                location:       item?.location || "Điểm đến đã chọn",
                title:          item?.title    || item?.name || "Dịch vụ",
                serviceId:      item?.id       || null,
                items:          item ? [{ name: item.title || "Dịch vụ", price: item.price }] : [],

                // ngày
                date:           dateFrom,
                checkOut:       dateTo,

                // giá
                subTotal:       Math.round(subtotal),
                tax:            Math.round(tax),
                total:          Math.round(discountedTotal),
                discount:       Math.round(discount),

                // thanh toán
                paymentTab:     payMode,
                paymentMethod:  (payMode==="online"||payMode==="deposit") ? onlineMethod : "pay_at_property",

                // coupon
                coupon:         coupon?.label    || null,
                couponCode:     coupon ? couponCode : null,

                // booking ref
                bookingId,
            });
            localStorage.removeItem("bookingItem");
            navigate("/Tour_Booking_Summery", {
                state: {
                    bookingId,
                    date:          dateFrom,
                    checkOut:      dateTo,
                    location:      item?.location||"Điểm đến đã chọn",
                    subTotal:      Math.round(subtotal),
                    tax:           Math.round(tax),
                    total:         Math.round(discountedTotal),
                    discount,
                    payMode,
                    payableNow:    Math.round(payableNow),
                    customerName:  form.fullName,
                    customerEmail: form.email,
                },
            });
        } catch(err) {
            setPayError("Lỗi hệ thống: "+(err.message||"Vui lòng thử lại."));
        } finally { setPaying(false); }
    };

    const dateFromFmt = fmtDate(dateFrom);
    const dateToFmt   = fmtDate(dateTo);

    /* ════════════════ RENDER ════════════════ */
    return (
        <div className="cu-root">
            <div className="container">

                {/* ── Page header + countdown ── */}
                <div className="cu-header">
                    <div>
                        <h1 className="cu-title">Hoàn tất đặt phòng</h1>
                        <nav className="cu-breadcrumb">
                            <Link to="/">Trang chủ</Link>
                            <i className="bi bi-chevron-right"></i>
                            <span>Thanh toán</span>
                        </nav>
                    </div>
                    <div className={`ck-countdown ${cd.warn?"ck-cd-warn":""} ${cd.expired?"ck-cd-expired":""}`}>
                        <i className={`bi ${cd.expired?"bi-clock-history":"bi-clock-fill"}`}></i>
                        <div>
                            <div className="ck-cd-label">{cd.expired?"Phiên hết hạn":"Giữ chỗ còn lại"}</div>
                            <div className="ck-cd-time">{cd.expired?"Tải lại trang":`${cd.min}:${cd.sec}`}</div>
                        </div>
                    </div>
                </div>

                <div className="cu-body">
                    <div className="cu-main">

                        {/* ══ Service summary card ══ */}
                        {item && (
                            <div className="cu-card ck-svc-card">
                                <div className="ck-svc-inner">
                                    {item.image && <img src={item.image} alt={item.title} className="ck-svc-img"/>}
                                    <div className="ck-svc-info">
                                        {item.category && <span className="ck-svc-type">{item.category}</span>}
                                        <h2 className="ck-svc-name">{item.title||item.name||"Dịch vụ"}</h2>
                                        {item.roomName && (
                                            <div className="ck-svc-room-badge">
                                                <i className="bi bi-door-open-fill"></i> {item.roomName}
                                            </div>
                                        )}
                                        <div className="ck-svc-meta">
                                            {item.location && <span><i className="bi bi-geo-alt-fill"></i>{item.location}</span>}
                                            {item.nights  && <span><i className="bi bi-moon-fill"></i>{item.nights} đêm</span>}
                                            {item.roomsCount>1 && <span><i className="bi bi-door-open"></i>{item.roomsCount} phòng</span>}
                                            {item.adults  && <span><i className="bi bi-people-fill"></i>{item.adults} người lớn{item.children>0?` · ${item.children} trẻ em`:""}</span>}
                                            {!item.nights && item.quantity>1 && <span><i className="bi bi-people-fill"></i>{item.quantity} khách</span>}
                                        </div>
                                        <div className="ck-svc-price-row">
                                            <span className="ck-svc-price">{fmtVND(item.price)}</span>
                                            <span className="ck-svc-price-unit">{item.nights ? "(đã gồm thuế)" : "/người"}</span>
                                        </div>
                                    </div>
                                    <div className="ck-svc-badge">
                                        <i className="bi bi-patch-check-fill"></i> Xác nhận tức thì
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ══ 1. Contact info ══ */}
                        <div className="cu-card">
                            <SectionHead num="1" icon="bi-person-lines-fill" title="Thông tin khách hàng"/>
                            <div className="cu-grid2">
                                <div className="cu-field cu-full">
                                    <label className="cu-label">Họ và tên <span className="cu-req">*</span></label>
                                    <div className="cu-wrap"><i className="bi bi-person cu-ico"></i>
                                        <input name="fullName" className="cu-input" placeholder="Nguyễn Văn A"
                                            value={form.fullName} onChange={onForm}/>
                                    </div>
                                </div>
                                <div className="cu-field">
                                    <label className="cu-label">Email <span className="cu-req">*</span></label>
                                    <div className="cu-wrap"><i className="bi bi-envelope cu-ico"></i>
                                        <input name="email" type="email" className="cu-input" placeholder="you@email.com"
                                            value={form.email} onChange={onForm}/>
                                    </div>
                                </div>
                                <div className="cu-field">
                                    <label className="cu-label">Số điện thoại <span className="cu-req">*</span></label>
                                    <div className="cu-wrap"><i className="bi bi-telephone cu-ico"></i>
                                        <input name="phone" type="tel" className="cu-input" placeholder="+84 xxx xxx xxx"
                                            value={form.phone} onChange={onForm}/>
                                    </div>
                                </div>
                                <div className="cu-field cu-full">
                                    <label className="cu-label">Yêu cầu đặc biệt <span className="cu-opt">(Tùy chọn)</span></label>
                                    <textarea name="notes" rows={2} className="cu-input cu-textarea"
                                        placeholder="Phòng tầng cao, dị ứng thực phẩm, đặt hoa sinh nhật..."
                                        value={form.notes} onChange={onForm}/>
                                </div>
                            </div>
                        </div>

                        {/* ══ 2. Dates ══ */}
                        <div className="cu-card cu-card-date">
                            <SectionHead num="2" icon="bi-calendar3" title="Ngày dịch vụ"/>
                            <div className="cu-cal-trigger-row" ref={calWrapRef}>
                                <button type="button"
                                    className={`cu-cal-trigger ${calOpen?"cu-cal-trigger-open":""}`}
                                    onClick={()=>setCalOpen(o=>!o)}>
                                    <div className="cu-cal-half">
                                        <i className="bi bi-calendar-check cu-cal-ico"></i>
                                        <div className="cu-cal-texts">
                                            <span className="cu-cal-label">NHẬN PHÒNG</span>
                                            <span className={`cu-cal-val ${!dateFromFmt?"cu-cal-placeholder":""}`}>
                                                {dateFromFmt||"Chọn ngày"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="cu-cal-arrow"><i className="bi bi-arrow-right"></i></div>
                                    <div className="cu-cal-half">
                                        <i className="bi bi-calendar-x cu-cal-ico"></i>
                                        <div className="cu-cal-texts">
                                            <span className="cu-cal-label">TRẢ PHÒNG</span>
                                            <span className={`cu-cal-val ${!dateToFmt?"cu-cal-placeholder":""}`}>
                                                {dateToFmt||(dateFromFmt?"Chọn ngày trả":"Chọn ngày")}
                                            </span>
                                        </div>
                                    </div>
                                    {(dateFrom||dateTo)&&(
                                        <button type="button" className="cu-cal-clear"
                                            onClick={e=>{e.stopPropagation();setDateFrom("");setDateTo("");}}>
                                            <i className="bi bi-x"></i>
                                        </button>
                                    )}
                                </button>
                                {calOpen&&(
                                    <div className="cu-cal-popup">
                                        <div className="cal-nav">
                                            <button className="cal-arrow" onClick={prevMonth}><i className="bi bi-chevron-left"></i></button>
                                            <div className="cal-months-wrap">
                                                {renderMonth(viewYear,viewMonth)}
                                                {renderMonth(year2,month2)}
                                            </div>
                                            <button className="cal-arrow" onClick={nextMonth}><i className="bi bi-chevron-right"></i></button>
                                        </div>
                                        <p className="cal-hint">
                                            {!dateFrom?"Chọn ngày nhận phòng":!dateTo?"Chọn ngày trả phòng":`${dateFromFmt} → ${dateToFmt}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {dateFrom&&dateTo&&(
                                <div className="cu-date-summary">
                                    <i className="bi bi-check-circle-fill" style={{color:"#22c55e"}}></i>
                                    <span>Đã chọn: <strong>{dateFromFmt}</strong> → <strong>{dateToFmt}</strong></span>
                                </div>
                            )}
                        </div>

                        {/* ══ 3. Payment method ══ */}
                        <div className="cu-card">
                            <SectionHead num="3" icon="bi-credit-card-2-front" title="Phương thức thanh toán"/>

                            {/* 3 payment modes */}
                            <div className="ck-pay-modes">
                                {[
                                    { id:"online",      icon:"bi-lightning-charge-fill", color:"green",  label:"Thanh toán ngay online",  sub:"Visa · MoMo · VNPay",                              badge:"Xác nhận tức thì"  },
                                    { id:"at_property", icon:"bi-building-check",         color:"blue",   label:"Thanh toán tại nơi",      sub:"Trả tiền khi check-in",                             badge:"Miễn phí hủy 24h"  },
                                    { id:"deposit",     icon:"bi-piggy-bank-fill",         color:"orange", label:"Đặt cọc 30%",             sub: depositAmount ? `Cọc ${fmtVND(depositAmount)}` : "30% giá trị đơn", badge:"Giữ chỗ ngay" },
                                ].map(m=>(
                                    <button key={m.id}
                                        className={`ck-pay-mode ck-pm-${m.color} ${payMode===m.id?"ck-pm-on":""}`}
                                        onClick={()=>setPayMode(m.id)}>
                                        <div className="ck-pm-ico"><i className={`bi ${m.icon}`}></i></div>
                                        <div className="ck-pm-texts">
                                            <span className="ck-pm-label">{m.label}</span>
                                            <span className="ck-pm-sub">{m.sub}</span>
                                        </div>
                                        <span className="ck-pm-badge">{m.badge}</span>
                                        {payMode===m.id&&<i className="bi bi-check-circle-fill ck-pm-check"></i>}
                                    </button>
                                ))}
                            </div>

                            {/* ── Online sub-methods ── */}
                            {(payMode==="online"||payMode==="deposit")&&(
                                <div className="ck-online-section">
                                    <p className="ck-online-heading">
                                        {payMode==="deposit"
                                            ? `Chọn phương thức đặt cọc ${fmtVND(depositAmount)}`
                                            : "Chọn phương thức thanh toán"}
                                    </p>
                                    <div className="ck-online-list">
                                        {ONLINE_METHODS.map(m=>(
                                            <button key={m.id}
                                                className={`ck-online-btn ${onlineMethod===m.id?"ck-online-on":""}`}
                                                onClick={()=>setOnlineMethod(m.id)}>
                                                <i className={`bi ${m.icon} ck-online-ico`}></i>
                                                <div className="ck-online-texts">
                                                    <span className="ck-online-name">{m.label}</span>
                                                    <span className="ck-online-sub">{m.sub}</span>
                                                </div>
                                                {onlineMethod===m.id
                                                    ?<i className="bi bi-check-circle-fill ck-online-check"></i>
                                                    :<i className="bi bi-chevron-right ck-online-arr"></i>}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Card form */}
                                    {onlineMethod==="card"&&(()=>{
                                        const ct=detectCardType(card.number);
                                        const dn=card.number
                                            ?card.number.padEnd(19," ").replace(/ {1}/g,"•").slice(0,19)
                                            :"•••• •••• •••• ••••";
                                        return(
                                            <div className="ck-card-wrap">
                                                <div className="pf-card-preview" style={{background:ct.grad}}>
                                                    <div className="pf-chip"><div className="pf-chip-inner"/></div>
                                                    <div className="pf-preview-number">{dn}</div>
                                                    <div className="pf-preview-row">
                                                        <div>
                                                            <div className="pf-preview-label">Chủ thẻ</div>
                                                            <div className="pf-preview-val">{card.name?card.name.toUpperCase():"TÊN CHỦ THẺ"}</div>
                                                        </div>
                                                        <div style={{textAlign:"right"}}>
                                                            <div className="pf-preview-label">Hết hạn</div>
                                                            <div className="pf-preview-val">{card.expiry||"MM/YY"}</div>
                                                        </div>
                                                        {ct.label&&<div className="pf-preview-brand">{ct.label}</div>}
                                                    </div>
                                                    <div className="pf-deco-circle pf-deco-1"/>
                                                    <div className="pf-deco-circle pf-deco-2"/>
                                                </div>
                                                <div className="cu-grid2" style={{marginTop:16}}>
                                                    <div className="cu-field cu-full">
                                                        <label className="cu-label">Số thẻ</label>
                                                        <div className="cu-wrap"><i className="bi bi-credit-card cu-ico"></i>
                                                            <input name="number" className="cu-input" placeholder="1234 5678 9012 3456"
                                                                value={card.number} onChange={onCard} autoComplete="cc-number" inputMode="numeric"/>
                                                        </div>
                                                    </div>
                                                    <div className="cu-field cu-full">
                                                        <label className="cu-label">Tên chủ thẻ</label>
                                                        <div className="cu-wrap"><i className="bi bi-person cu-ico"></i>
                                                            <input name="name" className="cu-input" placeholder="NGUYEN VAN A"
                                                                value={card.name} onChange={onCard} autoComplete="cc-name"/>
                                                        </div>
                                                    </div>
                                                    <div className="cu-field">
                                                        <label className="cu-label">Ngày hết hạn</label>
                                                        <div className="cu-wrap"><i className="bi bi-calendar-event cu-ico"></i>
                                                            <input name="expiry" className="cu-input" placeholder="MM/YY"
                                                                value={card.expiry} onChange={onCard} autoComplete="cc-exp" inputMode="numeric"/>
                                                        </div>
                                                    </div>
                                                    <div className="cu-field">
                                                        <label className="cu-label">CVV <span className="pf-cvv-hint" title="3–4 số mặt sau thẻ">?</span></label>
                                                        <div className="cu-wrap"><i className="bi bi-shield-lock cu-ico"></i>
                                                            <input name="cvv" type="password" className="cu-input" placeholder="•••" maxLength={4}
                                                                value={card.cvv} onChange={onCard} autoComplete="cc-csc" inputMode="numeric"/>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="pf-ssl-row" style={{marginTop:12}}>
                                                    <span className="pf-ssl-badge"><i className="bi bi-lock-fill"></i> SSL 256-bit</span>
                                                    <span className="pf-ssl-badge"><i className="bi bi-shield-check"></i> PCI DSS</span>
                                                    <span className="pf-ssl-badge"><i className="bi bi-eye-slash"></i> Bảo mật</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* MoMo / VNPay redirect notice */}
                                    {(onlineMethod==="momo"||onlineMethod==="vnpay")&&(
                                        <div className="ck-redirect-box">
                                            <i className="bi bi-box-arrow-up-right"></i>
                                            <span>Sau khi xác nhận, bạn sẽ được chuyển đến{" "}
                                                <strong>{onlineMethod==="momo"?"MoMo":"VNPay"}</strong>{" "}
                                                để hoàn tất thanh toán an toàn.</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── At property info ── */}
                            {payMode==="at_property"&&(
                                <div className="ck-at-prop">
                                    <div className="ck-at-prop-ico"><i className="bi bi-building-check"></i></div>
                                    <div>
                                        <div className="ck-at-prop-title">Thanh toán tại {item?.title||"cơ sở"}</div>
                                        <div className="ck-at-prop-desc">
                                            Đặt phòng được xác nhận ngay · Trả <strong>{fmtVND(discountedTotal)}</strong> khi check-in
                                        </div>
                                        <div className="ck-at-prop-chips">
                                            <span><i className="bi bi-check-circle-fill"></i> Miễn phí hủy trước 24 giờ</span>
                                            <span><i className="bi bi-check-circle-fill"></i> Không cần thẻ ngay bây giờ</span>
                                            <span><i className="bi bi-check-circle-fill"></i> Xác nhận email tức thì</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Deposit breakdown ── */}
                            {payMode==="deposit"&&(
                                <div className="ck-deposit">
                                    <div className="ck-dep-block ck-dep-now">
                                        <div className="ck-dep-lbl">Đặt cọc ngay</div>
                                        <div className="ck-dep-amt">{fmtVND(depositAmount)}</div>
                                        <div className="ck-dep-pct">30% tổng giá trị</div>
                                    </div>
                                    <div className="ck-dep-plus"><i className="bi bi-plus-lg"></i></div>
                                    <div className="ck-dep-block ck-dep-later">
                                        <div className="ck-dep-lbl">Thanh toán khi check-in</div>
                                        <div className="ck-dep-amt">{fmtVND(remainingAmt)}</div>
                                        <div className="ck-dep-pct">70% còn lại</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ══ 4. Coupon ══ */}
                        <div className="cu-card">
                            <SectionHead num="4" icon="bi-tag-fill" title="Mã giảm giá"/>
                            {coupon?(
                                <div className="ck-coupon-applied">
                                    <div className="ck-coupon-applied-l">
                                        <i className="bi bi-ticket-perforated-fill"></i>
                                        <div>
                                            <div className="ck-ca-label">{coupon.label}</div>
                                            <div className="ck-ca-save">Tiết kiệm {fmtVND(coupon.discount)}</div>
                                        </div>
                                    </div>
                                    <button className="ck-coupon-rm" onClick={removeCoupon}>
                                        <i className="bi bi-x-circle-fill"></i>
                                    </button>
                                </div>
                            ):(
                                <>
                                    <div className="ck-coupon-row">
                                        <div className="cu-wrap" style={{flex:1}}>
                                            <i className="bi bi-tag cu-ico"></i>
                                            <input type="text" className="cu-input"
                                                placeholder="Nhập mã giảm giá (VD: DAYTRIP10)"
                                                value={couponCode}
                                                onChange={e=>{setCouponCode(e.target.value);setCouponErr("");}}
                                                onKeyDown={e=>e.key==="Enter"&&applyCoupon()}/>
                                        </div>
                                        <button className="ck-coupon-btn" onClick={applyCoupon} disabled={couponLoading}>
                                            {couponLoading?<span className="af-spinner"/>:"Áp dụng"}
                                        </button>
                                    </div>
                                    {couponErr&&(
                                        <div className="ck-coupon-err">
                                            <i className="bi bi-exclamation-circle"></i> {couponErr}
                                        </div>
                                    )}
                                    <div className="ck-coupon-hints">
                                        Thử mã:{" "}
                                        {["DAYTRIP10","SAVE50K","SUMMER20"].map(c=>(
                                            <button key={c} className="ck-coupon-chip" onClick={()=>setCouponCode(c)}>{c}</button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ══ Submit area ══ */}
                        <div className="cu-submit-area">
                            {payError&&(
                                <div className="cu-error"><i className="bi bi-exclamation-triangle-fill"></i> {payError}</div>
                            )}
                            <label className="cu-agree">
                                <input type="checkbox" className="af-checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/>
                                <span>Tôi đồng ý với <a href="#" className="cu-link">Điều khoản dịch vụ</a> và <a href="#" className="cu-link">Chính sách bảo mật</a> của DayTrip</span>
                            </label>

                            {/* Pay-now summary strip */}
                            <div className="ck-pay-strip">
                                <div className="ck-pay-strip-l">
                                    <span className="ck-pay-strip-lbl">
                                        {payMode==="at_property"?"Thanh toán tại nơi":payMode==="deposit"?"Đặt cọc ngay":"Thanh toán ngay"}
                                    </span>
                                    <span className="ck-pay-strip-sub">
                                        {payMode==="at_property"?"Không tính phí hôm nay":payMode==="deposit"?`Còn lại ${fmtVND(remainingAmt)} khi check-in`:"Thanh toán an toàn"}
                                    </span>
                                </div>
                                <span className="ck-pay-strip-amt">
                                    {payMode==="at_property"?fmtVND(0):fmtVND(payableNow)}
                                </span>
                            </div>

                            <button className="cu-pay-btn" onClick={handlePay} disabled={!canPay||paying}>
                                {paying
                                    ?<><span className="af-spinner"></span> Đang xử lý...</>
                                    :<>
                                        <i className={payMode==="at_property"?"bi bi-building-check":payMode==="deposit"?"bi bi-piggy-bank-fill":"bi bi-lock-fill"}></i>
                                        {" "}
                                        {payMode==="at_property"?"Xác nhận đặt phòng":payMode==="deposit"?`Đặt cọc ${fmtVND(depositAmount)}`:`Thanh toán ${fmtVND(payableNow)}`}
                                    </>
                                }
                            </button>

                            <p className="cu-ssl">
                                <i className="bi bi-shield-check"></i>
                                Mã đặt phòng: <strong>#{bookingId}</strong> · SSL 256-bit · Xác nhận qua email
                            </p>
                        </div>

                    </div>{/* /cu-main */}

                    {/* ════════ RIGHT: Sidebar ════════ */}
                    <div className="cu-sidebar">
                        <div className="cu-summary">

                            {/* Service card */}
                            {item&&(
                                <div className="cu-svc">
                                    {item.image&&<img src={item.image} alt={item.title} className="cu-svc-img"/>}
                                    <div className="cu-svc-info">
                                        <p className="cu-svc-name">{item.title||item.name||"Dịch vụ"}</p>
                                        {item.location&&<p className="cu-svc-loc"><i className="bi bi-geo-alt-fill"></i>{item.location}</p>}
                                        {item.quantity>1&&<p className="cu-svc-qty">× {item.quantity} khách</p>}
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            {(dateFrom||dateTo)&&(
                                <div className="cu-sb-dates">
                                    <div className="cu-sb-date-row">
                                        <div className="cu-sb-date-block">
                                            <span className="cu-sb-date-lbl"><i className="bi bi-box-arrow-in-right"></i> Nhận phòng</span>
                                            <span className="cu-sb-date-val">{dateFromFmt||<em className="cu-sb-date-empty">Chưa chọn</em>}</span>
                                        </div>
                                        <div className="cu-sb-date-sep">→</div>
                                        <div className="cu-sb-date-block cu-sb-date-right">
                                            <span className="cu-sb-date-lbl"><i className="bi bi-box-arrow-right"></i> Trả phòng</span>
                                            <span className="cu-sb-date-val">{dateToFmt||<em className="cu-sb-date-empty">Chưa chọn</em>}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Price breakdown */}
                            <div className="cu-prices">
                                <div className="cu-price-row"><span>Giá dịch vụ</span><span>{fmtVND(subtotal)}</span></div>
                                <div className="cu-price-row"><span>Thuế VAT (10%)</span><span>{fmtVND(tax)}</span></div>
                                {discount>0&&(
                                    <div className="cu-price-row cu-price-discount">
                                        <span><i className="bi bi-tag-fill"></i> {coupon?.label}</span>
                                        <span>− {fmtVND(discount)}</span>
                                    </div>
                                )}
                                <div className="cu-price-total">
                                    <span>Tổng cộng</span>
                                    <span className="cu-total-num">{fmtVND(discountedTotal)}</span>
                                </div>
                            </div>

                            {/* Payment mode badge */}
                            <div className={`cu-pay-at-prop ${payMode==="deposit"?"cu-pap-deposit":payMode==="online"?"cu-pap-online":""}`}>
                                <div className="cu-pay-at-prop-top">
                                    <i className={`bi ${payMode==="at_property"?"bi-building-check":payMode==="deposit"?"bi-piggy-bank-fill":"bi-lightning-charge-fill"}`}></i>
                                    <span>{payMode==="at_property"?"Thanh toán tại nơi":payMode==="deposit"?"Đặt cọc 30%":"Thanh toán online"}</span>
                                </div>
                                <p className="cu-pay-at-prop-desc">
                                    {payMode==="at_property"&&<>Bạn <strong>không bị tính phí</strong> hôm nay. Trả <strong>{fmtVND(discountedTotal)}</strong> khi check-in.</>}
                                    {payMode==="deposit"&&<>Cọc <strong>{fmtVND(depositAmount)}</strong> ngay · Còn lại <strong>{fmtVND(remainingAmt)}</strong> khi check-in.</>}
                                    {payMode==="online"&&<>Thanh toán <strong>{fmtVND(discountedTotal)}</strong> ngay. Xác nhận tức thì.</>}
                                </p>
                            </div>

                            {/* Policy list */}
                            <div className="cu-sb-policies">
                                {[
                                    {icon:"bi-x-circle-fill",        color:"#22c55e",label:"Miễn phí hủy trước 24 giờ"},
                                    {icon:"bi-lightning-charge-fill", color:"#f59e0b",label:"Xác nhận tức thì qua email"},
                                    {icon:"bi-headset",               color:"#60a5fa",label:"Hỗ trợ khách hàng 24/7"},
                                    {icon:"bi-shield-check",          color:"#a78bfa",label:"Bảo mật SSL 256-bit"},
                                ].map((p,i)=>(
                                    <div key={i} className="cu-sb-policy">
                                        <i className={`bi ${p.icon}`} style={{color:p.color}}></i>
                                        <span>{p.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Accepted payments */}
                            <div className="cu-accepted">
                                <i className="bi bi-paypal" title="PayPal"></i>
                                <i className="bi bi-credit-card-2-front" title="Visa"></i>
                                <i className="bi bi-credit-card-fill" title="Mastercard"></i>
                                <i className="bi bi-bank" title="Banking"></i>
                                <i className="bi bi-qr-code" title="VNPay"></i>
                            </div>
                        </div>
                    </div>

                </div>{/* /cu-body */}
            </div>
        </div>
    );
};

export default CheckoutUnified;
