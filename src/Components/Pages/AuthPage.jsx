import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import beachBg from "../../assets/destination-4.png";

const initialSignInState = { email: "", password: "" };
const initialSignUpState = { fullName: "", email: "", phone: "", homeCity: "", password: "", confirmPassword: "" };

const Field = ({ label, name, type = "text", placeholder, autoComplete, value, onChange: onCh, showToggle, show, onToggle, required, icon }) => (
    <div className="af-field">
        <label className="af-label">{label}</label>
        <div className="af-input-wrap">
            {icon && <i className={`bi ${icon} af-input-icon`}></i>}
            <input
                type={showToggle ? (show ? "text" : "password") : type}
                name={name}
                className={`af-input${!icon ? " no-icon" : ""}${showToggle ? " has-eye" : ""}`}
                placeholder={placeholder}
                autoComplete={autoComplete}
                value={value}
                onChange={onCh}
                required={required}
            />
            {showToggle && (
                <button type="button" className="af-eye" onClick={onToggle}>
                    <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
            )}
        </div>
    </div>
);

const LeftPanel = () => (
    <div
        className="af-panel-left"
        style={{
            backgroundImage: `linear-gradient(135deg, rgba(0,20,14,0.82) 0%, rgba(0,45,30,0.65) 55%, rgba(0,28,18,0.80) 100%), url(${beachBg})`,
        }}
    >
        <Link to="/" className="af-panel-logo">
            <i className="bi bi-compass-fill"></i>
            DAYTRIP
        </Link>

        <div className="af-panel-hero">
            <h2 className="af-panel-tagline">
                Khám phá <em>Việt Nam</em><br />cùng DAYTRIP
            </h2>
            <p className="af-panel-sub">
                Đặt tour, khách sạn, phương tiện và nhà hàng trong một nơi duy nhất — nhanh chóng, an toàn và tiện lợi.
            </p>
            <div className="af-destinations">
                <span className="af-dest-badge"><i className="bi bi-geo-alt-fill"></i>Hà Nội</span>
                <span className="af-dest-badge"><i className="bi bi-geo-alt-fill"></i>Đà Nẵng</span>
                <span className="af-dest-badge"><i className="bi bi-geo-alt-fill"></i>Hội An</span>
                <span className="af-dest-badge"><i className="bi bi-geo-alt-fill"></i>TP. Hồ Chí Minh</span>
                <span className="af-dest-badge"><i className="bi bi-geo-alt-fill"></i>Phú Quốc</span>
            </div>
        </div>

        <div className="af-panel-stats">
            <div>
                <div className="af-panel-stat-num">15+</div>
                <div className="af-panel-stat-label">Tours</div>
            </div>
            <div>
                <div className="af-panel-stat-num">9</div>
                <div className="af-panel-stat-label">Khách sạn</div>
            </div>
            <div>
                <div className="af-panel-stat-num">9</div>
                <div className="af-panel-stat-label">Nhà hàng</div>
            </div>
        </div>
    </div>
);

const AuthPage = () => {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { signIn, signUp, resetPassword, loginWithGoogle, loginWithFacebook } = useAuth();

    const isSignIn       = location.pathname === "/signin";
    const redirectTarget = location.state?.from?.pathname || "/account";

    const [signInForm,   setSignInForm]   = useState(initialSignInState);
    const [signUpForm,   setSignUpForm]   = useState(initialSignUpState);
    const [feedback,     setFeedback]     = useState({ type: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPass,     setShowPass]     = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [remember,     setRemember]     = useState(false);

    const [forgotStep,  setForgotStep]  = useState(null);
    const [forgotEmail, setForgotEmail] = useState("");

    const openForgot  = (e) => { e.preventDefault(); setForgotStep("form"); setFeedback({ type: "", message: "" }); };
    const closeForgot = () => { setForgotStep(null); setForgotEmail(""); setFeedback({ type: "", message: "" }); };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail.trim()) { setFeedback({ type: "error", message: "Vui lòng nhập email." }); return; }
        setIsSubmitting(true);
        try {
            await resetPassword(forgotEmail.trim().toLowerCase());
            setForgotStep("done");
            setFeedback({ type: "", message: "" });
        } catch (err) {
            setFeedback({ type: "error", message: err.message || "Không tìm thấy tài khoản với email này." });
        } finally { setIsSubmitting(false); }
    };

    const handleSocialLogin = async (provider) => {
        setFeedback({ type: "", message: "" });
        setIsSubmitting(true);
        try {
            const user = await (provider === "google" ? loginWithGoogle() : loginWithFacebook());
            navigate(redirectByRole(user), { replace: true });
        } catch (err) {
            setFeedback({ type: "error", message: err.message });
        } finally { setIsSubmitting(false); }
    };

    const onChange = (setter) => (e) => setter(p => ({ ...p, [e.target.name]: e.target.value }));

    const validateSignUp = () => {
        if (!signUpForm.fullName.trim() || !signUpForm.email.trim() || !signUpForm.password || !signUpForm.confirmPassword)
            return "Vui lòng điền đầy đủ họ tên, email và mật khẩu.";
        if (signUpForm.password.length < 8) return "Mật khẩu cần ít nhất 8 ký tự.";
        if (signUpForm.password !== signUpForm.confirmPassword) return "Mật khẩu xác nhận chưa khớp.";
        return "";
    };

    const redirectByRole = (user) => user?.role === "admin" ? "/admin" : "/";

    const handleSignInSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: "", message: "" });
        setIsSubmitting(true);
        try {
            const user = await signIn(signInForm);
            navigate(redirectByRole(user), { replace: true });
        } catch (err) {
            setFeedback({ type: "error", message: err.message || "Đăng nhập thất bại." });
        } finally { setIsSubmitting(false); }
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: "", message: "" });
        const errMsg = validateSignUp();
        if (errMsg) { setFeedback({ type: "error", message: errMsg }); return; }
        setIsSubmitting(true);
        try {
            const user = await signUp(signUpForm);
            navigate(redirectByRole(user), { replace: true });
        } catch (err) {
            setFeedback({ type: "error", message: err.message || "Tạo tài khoản thất bại." });
        } finally { setIsSubmitting(false); }
    };

    /* ── Forgot password ── */
    if (forgotStep) return (
        <div className="af-root">
            <LeftPanel />
            <div className="af-panel-right">
                <Link to="/" className="af-mobile-logo">
                    <i className="bi bi-compass-fill"></i>DAYTRIP
                </Link>

                {forgotStep === "done" ? (
                    <div className="af-forgot-done">
                        <div className="af-forgot-icon af-forgot-icon-ok">
                            <i className="bi bi-envelope-check-fill"></i>
                        </div>
                        <h2 className="af-title">Kiểm tra email!</h2>
                        <p className="af-desc" style={{ textAlign: "center" }}>
                            Đã gửi link đặt lại mật khẩu tới <strong style={{ color: "#fff" }}>{forgotEmail}</strong>.
                        </p>
                        <div style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "1rem 1.25rem", textAlign: "left", fontSize: "0.84rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, width: "100%" }}>
                            <strong style={{ color: "#4ade80" }}>Hướng dẫn:</strong><br />
                            1. Mở email và tìm thư từ <strong>noreply@daytrip.app</strong><br />
                            2. Kiểm tra thêm thư mục <strong>Spam</strong> nếu không thấy<br />
                            3. Nhấp vào liên kết → nhập mật khẩu mới
                        </div>
                        <button className="af-submit" style={{ marginTop: 8 }} onClick={() => { closeForgot(); navigate("/signin"); }}>
                            <i className="bi bi-arrow-left me-1"></i> Về trang đăng nhập
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="af-forgot-icon">
                            <i className="bi bi-envelope-at-fill"></i>
                        </div>
                        <div className="af-header" style={{ textAlign: "center" }}>
                            <h2 className="af-title">Quên mật khẩu?</h2>
                            <p className="af-desc">Nhập email đã đăng ký — chúng tôi sẽ gửi link đặt lại ngay.</p>
                        </div>

                        {feedback.message && (
                            <div className={`af-feedback af-feedback-${feedback.type}`}>
                                <i className={`bi ${feedback.type === "error" ? "bi-exclamation-circle-fill" : "bi-check-circle-fill"}`}></i>
                                {feedback.message}
                            </div>
                        )}

                        <form onSubmit={handleForgotSubmit} className="af-form">
                            <Field label="Email đăng ký" name="forgotEmail" type="email"
                                placeholder="you@example.com" autoComplete="email" icon="bi-envelope"
                                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                            <button type="submit" className="af-submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? <><span className="af-spinner"></span>Đang gửi...</>
                                    : <><i className="bi bi-send me-2"></i>Gửi link đặt lại</>}
                            </button>
                        </form>

                        <button className="af-back-link" onClick={closeForgot}>
                            <i className="bi bi-arrow-left me-1"></i>Quay lại đăng nhập
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="af-root">
            {/* Left hero panel */}
            <LeftPanel />

            {/* Right form panel */}
            <div className="af-panel-right">
                {/* Mobile logo */}
                <Link to="/" className="af-mobile-logo">
                    <i className="bi bi-compass-fill"></i>DAYTRIP
                </Link>

                {/* Header */}
                <div className="af-header">
                    <div className="af-welcome-badge">
                        {isSignIn
                            ? <i className="bi bi-airplane-fill" style={{ transform: "rotate(-45deg)", display: "inline-block" }}></i>
                            : <i className="bi bi-stars"></i>
                        }
                    </div>
                    <h2 className="af-title">
                        {isSignIn ? "Chào mừng trở lại!" : "Bắt đầu hành trình"}
                    </h2>
                    <p className="af-desc">
                        {isSignIn
                            ? "Đăng nhập để tiếp tục khám phá những điểm đến tuyệt vời."
                            : "Tạo tài khoản miễn phí và bắt đầu chuyến đi trong mơ của bạn."}
                    </p>
                </div>

                {/* Feedback */}
                {feedback.message && (
                    <div className={`af-feedback af-feedback-${feedback.type}`}>
                        <i className={`bi ${feedback.type === "error" ? "bi-exclamation-circle-fill" : "bi-check-circle-fill"}`}></i>
                        {feedback.message}
                    </div>
                )}

                {/* Sign In */}
                {isSignIn ? (
                    <form onSubmit={handleSignInSubmit} className="af-form">
                        <Field label="Email" name="email" type="email" placeholder="you@example.com"
                            autoComplete="email" icon="bi-envelope"
                            value={signInForm.email} onChange={onChange(setSignInForm)} required />

                        <div className="af-field">
                            <label className="af-label">Mật khẩu</label>
                            <div className="af-input-wrap">
                                <i className="bi bi-lock af-input-icon"></i>
                                <input type={showPass ? "text" : "password"} name="password" className="af-input"
                                    placeholder="••••••••" autoComplete="current-password"
                                    value={signInForm.password} onChange={onChange(setSignInForm)} required />
                                <button type="button" className="af-eye" onClick={() => setShowPass(p => !p)}>
                                    <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="af-row-meta">
                            <label className="af-remember">
                                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="af-checkbox" />
                                Ghi nhớ đăng nhập
                            </label>
                            <a href="#" className="af-forgot" onClick={openForgot}>
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button type="submit" className="af-submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? <><span className="af-spinner"></span>Đang đăng nhập...</>
                                : <><i className="bi bi-box-arrow-in-right me-1"></i>Đăng nhập</>}
                        </button>
                    </form>
                ) : (
                    /* Sign Up */
                    <form onSubmit={handleSignUpSubmit} className="af-form">
                        <div className="af-grid">
                            <Field label="Họ và tên" name="fullName" placeholder="Nguyễn Văn A"
                                autoComplete="name" icon="bi-person"
                                value={signUpForm.fullName} onChange={onChange(setSignUpForm)} required />
                            <Field label="Email" name="email" type="email" placeholder="you@example.com"
                                autoComplete="email" icon="bi-envelope"
                                value={signUpForm.email} onChange={onChange(setSignUpForm)} required />
                            <Field label="Số điện thoại" name="phone" type="tel" placeholder="0912 345 678"
                                autoComplete="tel" icon="bi-telephone"
                                value={signUpForm.phone} onChange={onChange(setSignUpForm)} />
                            <Field label="Thành phố" name="homeCity" placeholder="Hà Nội"
                                autoComplete="address-level2" icon="bi-geo-alt"
                                value={signUpForm.homeCity} onChange={onChange(setSignUpForm)} />
                            <Field label="Mật khẩu" name="password" placeholder="Ít nhất 8 ký tự"
                                autoComplete="new-password" icon="bi-lock"
                                value={signUpForm.password} onChange={onChange(setSignUpForm)}
                                showToggle show={showPass} onToggle={() => setShowPass(p => !p)} required />
                            <Field label="Nhập lại mật khẩu" name="confirmPassword" placeholder="Xác nhận"
                                autoComplete="new-password" icon="bi-lock-fill"
                                value={signUpForm.confirmPassword} onChange={onChange(setSignUpForm)}
                                showToggle show={showConfirm} onToggle={() => setShowConfirm(p => !p)} required />
                        </div>

                        <button type="submit" className="af-submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? <><span className="af-spinner"></span>Đang tạo tài khoản...</>
                                : <><i className="bi bi-person-check me-1"></i>Tạo tài khoản</>}
                        </button>
                    </form>
                )}

                {/* Social login */}
                <div className="af-divider" style={{ marginTop: 20 }}><span>hoặc tiếp tục với</span></div>

                <div className="af-social">
                    <button type="button" className="af-social-btn"
                        onClick={() => handleSocialLogin("google")} disabled={isSubmitting}>
                        <svg width="17" height="17" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.1 26.8 36 24 36c-5.3 0-9.6-3.4-11.2-8l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
                            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C41 36.2 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
                        </svg>
                        Google
                    </button>
                    <button type="button" className="af-social-btn"
                        onClick={() => handleSocialLogin("facebook")} disabled={isSubmitting}>
                        <i className="bi bi-facebook" style={{ color: "#1877f2" }}></i>
                        Facebook
                    </button>
                </div>

                {/* Switch */}
                <p className="af-switch">
                    {isSignIn ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                    <Link to={isSignIn ? "/signup" : "/signin"} className="af-switch-link">
                        {isSignIn ? "Đăng ký ngay" : "Đăng nhập"}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
