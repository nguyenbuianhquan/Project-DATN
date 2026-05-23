import React, { createContext, useContext, useEffect, useState } from "react";
import {
    AUTH_DB_NAME,
    AUTH_SESSION_KEY,
    USER_STORE_NAME,
    clearAuthSession,
    registerUser,
    signInUser,
    deleteUserById,
    updateUserRole,
    resetUserPassword,
    signInWithGoogle,
    signInWithFacebook,
    firebaseErrorMessage,
    toggleUserLock,
    setUserOnline,
    updateUserProfile,
    changeUserPassword,
    getCurrentAuthenticatedUser,
    getRegisteredUsers,
} from "../lib/authStorage";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [users,       setUsers]       = useState([]);
    const [authReady,   setAuthReady]   = useState(false);

    // On mount: restore session from stored token
    useEffect(() => {
        const init = async () => {
            try {
                const user = await getCurrentAuthenticatedUser();
                if (user && user.role !== "admin") {
                    setCurrentUser(user);
                }
                // Only load user list for admin (endpoint requires admin role)
                if (user?.role === "admin") {
                    try { setUsers(await getRegisteredUsers()); } catch {}
                }
            } catch {
                setCurrentUser(null);
            } finally {
                setAuthReady(true);
            }
        };
        init();
    }, []);

    const refreshUsers = async () => {
        try {
            const list = await getRegisteredUsers();
            setUsers(list);
            return list;
        } catch {
            return [];
        }
    };

    const signUp = async (payload) => {
        const user = await registerUser(payload);
        if (user.role !== "admin") {
            setCurrentUser(user);
        }
        await refreshUsers();
        return user;
    };

    const signIn = async (payload) => {
        const user = await signInUser(payload);
        if (user.role === "admin") {
            await clearAuthSession();
            throw new Error("Tài khoản admin vui lòng đăng nhập tại trang quản trị (/admin).");
        }
        setCurrentUser(user);
        await refreshUsers();
        return user;
    };

    const signOut = async () => {
        if (currentUser?.id) {
            try { await setUserOnline(currentUser.id, false); } catch {}
        }
        await clearAuthSession();
        setCurrentUser(null);
    };

    const deleteUser = async (userId) => {
        await deleteUserById(userId);
        await refreshUsers();
    };

    const updateRole = async (userId, role) => {
        await updateUserRole(userId, role);
        await refreshUsers();
    };

    const resetPassword = async (email) => {
        await resetUserPassword(email);
    };

    const loginWithGoogle = async () => {
        const user = await signInWithGoogle();
        if (user.role === "admin") {
            await clearAuthSession();
            throw new Error("Tài khoản admin vui lòng đăng nhập tại trang quản trị (/admin).");
        }
        setCurrentUser(user);
        await refreshUsers();
        return user;
    };

    const loginWithFacebook = async () => {
        const user = await signInWithFacebook();
        if (user.role === "admin") {
            await clearAuthSession();
            throw new Error("Tài khoản admin vui lòng đăng nhập tại trang quản trị (/admin).");
        }
        setCurrentUser(user);
        await refreshUsers();
        return user;
    };

    const toggleLock = async (userId, isLocked) => {
        await toggleUserLock(userId, isLocked);
        await refreshUsers();
    };

    const updateProfile = async (data) => {
        const updated = await updateUserProfile(currentUser.id, data);
        setCurrentUser(updated);
        return updated;
    };

    const changePassword = async (currentPassword, newPassword) => {
        await changeUserPassword(currentPassword, newPassword);
    };

    useEffect(() => {
        const handleUnload = () => {
            if (currentUser?.id) {
                setUserOnline(currentUser.id, false).catch(() => {});
            }
        };
        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, [currentUser]);

    return (
        <AuthContext.Provider value={{
            currentUser,
            users,
            authReady,
            isAuthenticated: Boolean(currentUser),
            signUp,
            signIn,
            signOut,
            refreshUsers,
            deleteUser,
            updateRole,
            toggleLock,
            resetPassword,
            loginWithGoogle,
            loginWithFacebook,
            updateProfile,
            changePassword,
            firebaseErrorMessage,
            databaseInfo: {
                name:       AUTH_DB_NAME,
                store:      USER_STORE_NAME,
                sessionKey: AUTH_SESSION_KEY,
            },
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider.");
    return ctx;
};
