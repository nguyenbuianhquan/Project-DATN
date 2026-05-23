import React, { createContext, useContext, useState } from "react";
import { signInUser } from "../lib/authStorage";

const ADMIN_SESSION_KEY = "daytrip-admin";

const readSession = () => {
    try {
        const s = sessionStorage.getItem(ADMIN_SESSION_KEY);
        return s ? JSON.parse(s) : null;
    } catch { return null; }
};

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
    const [adminUser, setAdminUser] = useState(readSession);

    const adminLogin = async ({ email, password }) => {
        const user = await signInUser({ email, password });
        if (user.role !== "admin") throw new Error("Tài khoản này không có quyền quản trị.");
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
        setAdminUser(user);
        return user;
    };

    const adminLogout = () => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setAdminUser(null);
    };

    return (
        <AdminContext.Provider value={{ adminUser, adminLogin, adminLogout, firebaseReady: true }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const ctx = useContext(AdminContext);
    if (!ctx) throw new Error("useAdmin must be inside AdminProvider");
    return ctx;
};
