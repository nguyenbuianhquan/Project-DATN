import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const AuthRouteFallback = ({ title, description }) => (
    <section className="auth-shell py-5">
        <div className="container">
            <div className="auth-loading-card mx-auto">
                <span className="auth-eyebrow">{title}</span>
                <h2>{description}</h2>
            </div>
        </div>
    </section>
);

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { currentUser, authReady } = useAuth();
    const location = useLocation();

    if (!authReady) {
        return <AuthRouteFallback title="Secure Session" description="Đang xác thực tài khoản của bạn..." />;
    }

    if (!currentUser) {
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    if (requireAdmin && currentUser.role !== "admin") {
        return <Navigate to="/account" replace state={{ deniedFrom: location.pathname }} />;
    }

    return children;
};

export const GuestOnlyRoute = ({ children }) => {
    const { currentUser, authReady } = useAuth();

    if (!authReady) {
        return <AuthRouteFallback title="DAYTRIP Access" description="Đang kiểm tra phiên đăng nhập..." />;
    }

    if (currentUser) {
        return <Navigate to="/account" replace />;
    }

    return children;
};
