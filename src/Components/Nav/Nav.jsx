import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const NAV_LINKS = [
    { to: "/",           label: "Trang Chủ" },
    { to: "/tours",      label: "Tours" },
    { to: "/hotels",     label: "Khách Sạn" },
    { to: "/transport",  label: "Di Chuyển" },
    { to: "/Restaurants",label: "Ẩm Thực" },
    { to: "/about",      label: "Giới Thiệu" },
    { to: "/blog",       label: "Tin Tức" },
    { to: "/contact",    label: "Liên Hệ" },
];

const Nav = () => {
    const location   = useLocation();
    const navigate   = useNavigate();
    const { currentUser, isAuthenticated, signOut } = useAuth();

    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled]   = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    const close = () => setMenuOpen(false);
    const firstName = currentUser?.fullName?.split(" ")[0] || "Account";

    const isActive = (to) => {
        if (to === "/") return location.pathname === "/";
        return location.pathname.startsWith(to);
    };

    const handleSignOut = async () => { await signOut(); close(); navigate("/signin"); };

    return (
        <nav className={`dn-nav${scrolled ? " dn-nav-scrolled" : ""}`}>
            <div className="container">
                <div className="dn-inner">

                    {/* ── Logo ── */}
                    <Link
                        to="/"
                        className="dn-logo"
                        onClick={() => { close(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                        DAY<span>TRIP</span>
                    </Link>

                    {/* ── Desktop links ── */}
                    <ul className="dn-links">
                        {NAV_LINKS.map(({ to, label }) => (
                            <li key={to}>
                                <Link
                                    to={to}
                                    className={`dn-link${isActive(to) ? " dn-link-active" : ""}`}
                                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* ── Desktop actions ── */}
                    <div className="dn-actions">
                        {isAuthenticated ? (
                            <>
                                <Link to="/account" className="dn-avatar" title="Tài khoản">
                                    <span className="dn-avatar-initials">{currentUser.initials}</span>
                                    <span className="dn-avatar-name">{firstName}</span>
                                </Link>
                                <button className="dn-btn-primary" onClick={handleSignOut}>
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/signin" className="dn-btn-outline">Đăng nhập</Link>
                                <Link to="/signup" className="dn-btn-primary">Đăng ký</Link>
                            </>
                        )}
                    </div>

                    {/* ── Mobile toggle ── */}
                    <button
                        className="dn-toggle"
                        onClick={() => setMenuOpen(p => !p)}
                        aria-label="Menu"
                    >
                        <i className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`}></i>
                    </button>
                </div>

                {/* ── Mobile menu ── */}
                {menuOpen && (
                    <div className="dn-mobile">
                        <ul className="dn-mobile-links">
                            {NAV_LINKS.map(({ to, label }) => (
                                <li key={to}>
                                    <Link
                                        to={to}
                                        className={`dn-mobile-link${isActive(to) ? " dn-link-active" : ""}`}
                                        onClick={() => { close(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="dn-mobile-actions">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/account" className="dn-avatar w-100" onClick={close}>
                                        <span className="dn-avatar-initials">{currentUser.initials}</span>
                                        <span className="dn-avatar-name">{currentUser.fullName}</span>
                                    </Link>
                                    <button className="dn-btn-primary w-100" onClick={handleSignOut}>
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/signin" className="dn-btn-outline w-100 justify-content-center" onClick={close}>Đăng nhập</Link>
                                    <Link to="/signup" className="dn-btn-primary w-100 text-center" onClick={close}>Đăng ký</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Nav;
