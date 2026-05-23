import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { applyPasswordReset, verifyResetCode } from "../../lib/authStorage";

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const params   = new URLSearchParams(window.location.search);
    const oobCode  = params.get("oobCode");
    const mode     = params.get("mode");

    const [status,  setStatus]  = useState("loading"); // loading | form | success | error
    const [email,   setEmail]   = useState("");
    const [pwd,     setPwd]     = useState("");
    const [pwd2,    setPwd2]    = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [errMsg,  setErrMsg]  = useState("");
    const [busy,    setBusy]    = useState(false);

    useEffect(() => {
        const validModes = ["resetPassword", "action"];
        if (!validModes.includes(mode) || !oobCode) {
            setStatus("error");
            setErrMsg("Liên kết không hợp lệ hoặc đã hết hạn.");
            return;
        }
        verifyResetCode(oobCode)
            .then((resolvedEmail) => {
                setEmail(resolvedEmail);
                setStatus("form");
            })
            .catch(() => {
                setStatus("error");
                setErrMsg("Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.");
            });
    }, [oobCode, mode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (pwd.length < 8) { setErrMsg("Mật khẩu phải ít nhất 8 ký tự."); return; }
        if (pwd !== pwd2)   { setErrMsg("Mật khẩu xác nhận không khớp."); return; }
        setBusy(true);
        setErrMsg("");
        try {
            await applyPasswordReset(oobCode, pwd);
            setStatus("success");
        } catch (err) {
            setErrMsg(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="af-root">
            <div className="af-card">
                <Link to="/" className="af-logo"><i className="bi bi-compass-fill"></i>DAYTRIP</Link>

                {status === "loading" && (
                    <div style={{ textAlign: "center", padding: "2rem 0", color: "rgba(255,255,255,0.5)" }}>
                        <span className="af-spinner" style={{ width: 28, height: 28, borderWidth: 3 }}></span>
                        <p style={{ marginTop: "1rem" }}>Đang xác thực liên kết...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="af-forgot-done">
                        <div className="af-forgot-icon af-forgot-icon-ok">
                            <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h2 className="af-title">Đổi mật khẩu thành công!</h2>
                        <p className="af-desc">
                            Mật khẩu mới của <strong>{email}</strong> đã được cập nhật. Bạn có thể đăng nhập ngay.
                        </p>
                        <button className="af-submit" onClick={() => navigate("/signin", { replace: true })}>
                            <i className="bi bi-box-arrow-in-right me-2"></i>Đăng nhập ngay
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="af-forgot-done">
                        <div className="af-forgot-icon" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                            <i className="bi bi-x-circle-fill"></i>
                        </div>
                        <h2 className="af-title">Liên kết không hợp lệ</h2>
                        <p className="af-desc">{errMsg}</p>
                        <button className="af-submit" onClick={() => navigate("/signin", { replace: true })}>
                            Thử lại
                        </button>
                    </div>
                )}

                {status === "form" && (
                    <>
                        <div className="af-header">
                            <div className="af-forgot-icon"><i className="bi bi-lock-fill"></i></div>
                            <h2 className="af-title">Đặt mật khẩu mới</h2>
                            <p className="af-desc">
                                Tài khoản: <strong style={{ color: "#fff" }}>{email}</strong>
                            </p>
                        </div>

                        {errMsg && (
                            <div className="af-feedback af-feedback-error">
                                <i className="bi bi-exclamation-circle-fill"></i> {errMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="af-form">
                            <div className="af-field">
                                <label className="af-label">Mật khẩu mới</label>
                                <div className="af-input-wrap">
                                    <input
                                        type={showPwd ? "text" : "password"}
                                        className="af-input"
                                        placeholder="Ít nhất 8 ký tự"
                                        value={pwd}
                                        onChange={e => setPwd(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="af-eye" onClick={() => setShowPwd(p => !p)}>
                                        <i className={`bi ${showPwd ? "bi-eye-slash" : "bi-eye"}`}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="af-field">
                                <label className="af-label">Xác nhận mật khẩu mới</label>
                                <div className="af-input-wrap">
                                    <input
                                        type={showPwd ? "text" : "password"}
                                        className="af-input"
                                        placeholder="Nhập lại mật khẩu"
                                        value={pwd2}
                                        onChange={e => setPwd2(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="af-submit" disabled={busy}>
                                {busy
                                    ? <><span className="af-spinner"></span>Đang cập nhật...</>
                                    : <><i className="bi bi-shield-check me-2"></i>Xác nhận đổi mật khẩu</>
                                }
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
