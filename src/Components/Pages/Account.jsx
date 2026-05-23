import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { updateOrderStatus, getMyOrders } from "../../lib/authStorage";

const fmtVND = (n) => Math.round(n).toLocaleString('vi-VN') + ' ₫';

const Field = ({ label, icon, value, onChange, type = "text", placeholder, readOnly, hint }) => (
    <div className="acc-field">
        <label className="acc-label">{label}</label>
        <div className="acc-input-wrap">
            <i className={`bi ${icon} acc-input-icon`}></i>
            <input
                type={type}
                className="acc-input"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                readOnly={readOnly}
            />
        </div>
        {hint && <span className="acc-hint">{hint}</span>}
    </div>
);

const Alert = ({ type, message }) => {
    if (!message) return null;
    const isErr = type === "error";
    return (
        <div className={`acc-alert ${isErr ? "acc-alert-error" : "acc-alert-success"}`}>
            <i className={`bi ${isErr ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"}`}></i>
            {message}
        </div>
    );
};

const ORDER_STATUS = {
    pending:   { label: "Chờ xác nhận", color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)"  },
    confirmed: { label: "Đã xác nhận",  color: "#22c55e", bg: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.3)"   },
    completed: { label: "Hoàn tất",     color: "#6366f1", bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.3)"  },
    cancelled: { label: "Đã hủy",       color: "#ef4444", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)"   },
};

const StatusBadge = ({ status }) => {
    const s = ORDER_STATUS[status] || ORDER_STATUS.pending;
    return (
        <span style={{
            fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        }}>
            {s.label}
        </span>
    );
};

const Account = () => {
    const navigate = useNavigate();
    const { currentUser, signOut, updateProfile, changePassword } = useAuth();

    const [tab, setTab] = useState("profile");

    // Profile form
    const [profile, setProfile] = useState({
        fullName: currentUser?.fullName || "",
        phone:    currentUser?.phone    || "",
        homeCity: currentUser?.homeCity || "",
    });
    const [profileMsg,    setProfileMsg]    = useState({ type: "", text: "" });
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form
    const [pwd, setPwd]           = useState({ current: "", newPwd: "", confirm: "" });
    const [showPwd, setShowPwd]   = useState({ current: false, newPwd: false, confirm: false });
    const [pwdMsg, setPwdMsg]     = useState({ type: "", text: "" });
    const [savingPwd, setSavingPwd] = useState(false);

    // Orders
    const [orders, setOrders]         = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [cancellingId, setCancellingId]   = useState(null);
    const [cancelConfirm, setCancelConfirm] = useState(null); // orderId awaiting confirm

    useEffect(() => {
        if (tab !== "orders" || !currentUser?.id) return;
        setOrdersLoading(true);
        getMyOrders()
            .then(setOrders)
            .catch(() => {})
            .finally(() => setOrdersLoading(false));
    }, [tab, currentUser?.id]);

    const handleCancel = async (orderId) => {
        setCancellingId(orderId);
        setCancelConfirm(null);
        try {
            await updateOrderStatus(orderId, "cancelled");
        } catch {
            // onSnapshot keeps list in sync; silent fail is fine here
        } finally {
            setCancellingId(null);
        }
    };

    if (!currentUser) return null;

    const handleSignOut = async () => {
        await signOut();
        navigate("/signin");
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!profile.fullName.trim()) {
            setProfileMsg({ type: "error", text: "Họ tên không được để trống." });
            return;
        }
        setSavingProfile(true);
        setProfileMsg({ type: "", text: "" });
        try {
            await updateProfile({
                fullName: profile.fullName.trim(),
                phone:    profile.phone.trim(),
                homeCity: profile.homeCity.trim(),
            });
            setProfileMsg({ type: "success", text: "Cập nhật thông tin thành công!" });
        } catch (err) {
            setProfileMsg({ type: "error", text: err.message });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePwd = async (e) => {
        e.preventDefault();
        if (!pwd.current) { setPwdMsg({ type: "error", text: "Vui lòng nhập mật khẩu hiện tại." }); return; }
        if (pwd.newPwd.length < 8) { setPwdMsg({ type: "error", text: "Mật khẩu mới phải ít nhất 8 ký tự." }); return; }
        if (pwd.newPwd !== pwd.confirm) { setPwdMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." }); return; }
        setSavingPwd(true);
        setPwdMsg({ type: "", text: "" });
        try {
            await changePassword(pwd.current, pwd.newPwd);
            setPwdMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
            setPwd({ current: "", newPwd: "", confirm: "" });
        } catch (err) {
            setPwdMsg({ type: "error", text: err.message });
        } finally {
            setSavingPwd(false);
        }
    };

    const fmtDate = (v) => v ? new Date(v).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" }) : "—";
    const fmtShortDate = (v) => v ? new Date(v).toLocaleDateString("vi-VN", { dateStyle: "short" }) : "—";

    const pendingCount = orders.filter(o => o.status === "pending").length;

    return (
        <div className="acc-root">
            <div className="container">

                {/* Header card */}
                <div className="acc-header-card">
                    <div className="acc-header-left">
                        <div className="acc-big-avatar">{currentUser.initials}</div>
                        <div>
                            <h2 className="acc-name">{currentUser.fullName}</h2>
                            <span className={`acc-role-badge ${currentUser.role}`}>
                                {currentUser.role === "admin" ? "Admin" : "Traveler"}
                            </span>
                            <p className="acc-email-sub">{currentUser.email}</p>
                        </div>
                    </div>
                    <button className="acc-signout-btn" onClick={handleSignOut}>
                        <i className="bi bi-box-arrow-right"></i> Đăng xuất
                    </button>
                </div>

                {/* Tabs */}
                <div className="acc-tabs">
                    <button className={`acc-tab ${tab === "profile" ? "acc-tab-active" : ""}`} onClick={() => setTab("profile")}>
                        <i className="bi bi-person-fill"></i> Hồ sơ cá nhân
                    </button>
                    <button className={`acc-tab ${tab === "orders" ? "acc-tab-active" : ""}`} onClick={() => setTab("orders")}>
                        <i className="bi bi-bag-check-fill"></i> Đơn hàng
                        {pendingCount > 0 && <span className="acc-tab-badge">{pendingCount}</span>}
                    </button>
                    <button className={`acc-tab ${tab === "password" ? "acc-tab-active" : ""}`} onClick={() => setTab("password")}>
                        <i className="bi bi-shield-lock-fill"></i> Đổi mật khẩu
                    </button>
                </div>

                {/* Profile tab */}
                {tab === "profile" && (
                    <div className="acc-content">
                        <div className="acc-section-card">
                            <h3 className="acc-section-title">
                                <i className="bi bi-person-lines-fill me-2"></i>Thông tin cá nhân
                            </h3>
                            <Alert type={profileMsg.type} message={profileMsg.text} />
                            <form onSubmit={handleSaveProfile}>
                                <div className="acc-fields-grid">
                                    <Field label="Họ và tên *" icon="bi-person"
                                        value={profile.fullName}
                                        onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                                        placeholder="Nguyễn Văn A" />
                                    <Field label="Email" icon="bi-envelope"
                                        value={currentUser.email} readOnly
                                        hint="Email không thể thay đổi trực tiếp." />
                                    <Field label="Số điện thoại" icon="bi-telephone"
                                        value={profile.phone}
                                        onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="+84 xxx xxx xxx" />
                                    <Field label="Thành phố" icon="bi-building"
                                        value={profile.homeCity}
                                        onChange={e => setProfile(p => ({ ...p, homeCity: e.target.value }))}
                                        placeholder="Hà Nội" />
                                </div>
                                <div className="acc-info-row">
                                    <span><i className="bi bi-clock-history me-1"></i>Đăng nhập lần cuối:</span>
                                    <strong>{fmtDate(currentUser.lastLoginAt)}</strong>
                                </div>
                                <div className="acc-info-row">
                                    <span><i className="bi bi-calendar-plus me-1"></i>Ngày tạo tài khoản:</span>
                                    <strong>{fmtDate(currentUser.createdAt)}</strong>
                                </div>
                                <button type="submit" className="acc-save-btn" disabled={savingProfile}>
                                    {savingProfile
                                        ? <><span className="af-spinner"></span>Đang lưu...</>
                                        : <><i className="bi bi-check2-circle me-2"></i>Lưu thay đổi</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Orders tab */}
                {tab === "orders" && (
                    <div className="acc-content">
                        <div className="acc-section-card">
                            <h3 className="acc-section-title">
                                <i className="bi bi-bag-check-fill me-2"></i>
                                Đơn hàng của tôi
                                {orders.length > 0 && (
                                    <span style={{ marginLeft: 8, fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                                        ({orders.length} đơn)
                                    </span>
                                )}
                            </h3>

                            {ordersLoading ? (
                                <div className="acc-orders-empty">
                                    <span className="af-spinner" style={{ width: 22, height: 22 }}></span>
                                    <p>Đang tải đơn hàng...</p>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="acc-orders-empty">
                                    <i className="bi bi-bag-x" style={{ fontSize: "2.5rem", color: "rgba(255,255,255,0.15)" }}></i>
                                    <p>Bạn chưa có đơn hàng nào.</p>
                                </div>
                            ) : (
                                <div className="acc-order-list">
                                    {orders.map(order => (
                                        <div key={order.id} className="acc-order-card">
                                            {/* Cancel confirm overlay */}
                                            {cancelConfirm === order.id && (
                                                <div className="acc-cancel-overlay">
                                                    <div className="acc-cancel-box">
                                                        <i className="bi bi-exclamation-triangle-fill" style={{ color: "#f59e0b", fontSize: "1.4rem" }}></i>
                                                        <p>Xác nhận hủy đơn hàng này?</p>
                                                        <div className="acc-cancel-actions">
                                                            <button
                                                                className="acc-cancel-confirm-btn"
                                                                disabled={cancellingId === order.id}
                                                                onClick={() => handleCancel(order.id)}
                                                            >
                                                                {cancellingId === order.id
                                                                    ? <span className="af-spinner"></span>
                                                                    : "Xác nhận hủy"}
                                                            </button>
                                                            <button
                                                                className="acc-cancel-back-btn"
                                                                onClick={() => setCancelConfirm(null)}
                                                            >
                                                                Quay lại
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Order header */}
                                            <div className="acc-order-header">
                                                <div>
                                                    <span className="acc-order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                    <span className="acc-order-date">{fmtDate(order.createdAt)}</span>
                                                </div>
                                                <StatusBadge status={order.status} />
                                            </div>

                                            {/* Order body */}
                                            <div className="acc-order-body">
                                                <div className="acc-order-row">
                                                    <i className="bi bi-geo-alt-fill" style={{ color: "#f59e0b" }}></i>
                                                    <span>{order.location || "Điểm đến đã chọn"}</span>
                                                </div>
                                                {order.date && (
                                                    <div className="acc-order-row">
                                                        <i className="bi bi-calendar3"></i>
                                                        <span>Ngày đi: {fmtShortDate(order.date)}</span>
                                                        {order.checkOut && <span style={{ color: "rgba(255,255,255,0.4)" }}>→ {fmtShortDate(order.checkOut)}</span>}
                                                    </div>
                                                )}
                                                {order.items?.length > 0 && (
                                                    <div className="acc-order-row">
                                                        <i className="bi bi-list-ul"></i>
                                                        <span>{order.items.map(i => i.name).join(", ")}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Order footer */}
                                            <div className="acc-order-footer">
                                                <div className="acc-order-total">
                                                    Tổng: <strong>{fmtVND(order.total || 0)}</strong>
                                                </div>
                                                {order.status === "pending" && (
                                                    <button
                                                        className="acc-order-cancel-btn"
                                                        onClick={() => setCancelConfirm(order.id)}
                                                        disabled={cancellingId === order.id}
                                                    >
                                                        <i className="bi bi-x-circle me-1"></i>Hủy đơn
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Password tab */}
                {tab === "password" && (
                    <div className="acc-content">
                        <div className="acc-section-card" style={{ maxWidth: 520 }}>
                            <h3 className="acc-section-title">
                                <i className="bi bi-shield-lock-fill me-2"></i>Đổi mật khẩu
                            </h3>
                            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.5rem" }}>
                                Nhập mật khẩu hiện tại để xác minh, sau đó đặt mật khẩu mới.
                            </p>
                            <Alert type={pwdMsg.type} message={pwdMsg.text} />
                            <form onSubmit={handleChangePwd}>
                                {[
                                    { key: "current", label: "Mật khẩu hiện tại", icon: "bi-lock-fill" },
                                    { key: "newPwd",  label: "Mật khẩu mới",      icon: "bi-lock"      },
                                    { key: "confirm", label: "Xác nhận mật khẩu", icon: "bi-lock-fill" },
                                ].map(f => (
                                    <div className="acc-field" key={f.key}>
                                        <label className="acc-label">{f.label}</label>
                                        <div className="acc-input-wrap">
                                            <i className={`bi ${f.icon} acc-input-icon`}></i>
                                            <input
                                                type={showPwd[f.key] ? "text" : "password"}
                                                className="acc-input"
                                                value={pwd[f.key]}
                                                onChange={e => setPwd(p => ({ ...p, [f.key]: e.target.value }))}
                                                placeholder="••••••••"
                                            />
                                            <button type="button" className="acc-eye-btn"
                                                onClick={() => setShowPwd(p => ({ ...p, [f.key]: !p[f.key] }))}>
                                                <i className={`bi ${showPwd[f.key] ? "bi-eye-slash" : "bi-eye"}`}></i>
                                            </button>
                                        </div>
                                        {f.key === "newPwd" && <span className="acc-hint">Tối thiểu 8 ký tự.</span>}
                                    </div>
                                ))}
                                <button type="submit" className="acc-save-btn" disabled={savingPwd}>
                                    {savingPwd
                                        ? <><span className="af-spinner"></span>Đang cập nhật...</>
                                        : <><i className="bi bi-shield-check me-2"></i>Cập nhật mật khẩu</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Account;
