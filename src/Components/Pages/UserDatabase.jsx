import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const formatDateTime = (value) => {
    if (!value) {
        return "Chưa có dữ liệu";
    }

    return new Date(value).toLocaleString("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const UserDatabase = () => {
    const { currentUser, users, refreshUsers, databaseInfo } = useAuth();

    const adminCount = users.filter((user) => user.role === "admin").length;
    const travelerCount = users.length - adminCount;
    const mostRecentLogin = users
        .slice()
        .sort((firstUser, secondUser) => new Date(secondUser.lastLoginAt || 0) - new Date(firstUser.lastLoginAt || 0))[0];

    return (
        <section className="database-shell section">
            <div className="container">
                <div className="database-hero-card">
                    <div>
                        <span className="auth-eyebrow">MySQL Database</span>
                        <h2>User records đang lưu trong DAYTRIP</h2>
                        <p>
                            Dữ liệu người dùng được lưu trên MySQL — bảo mật, ổn định, chạy trên backend server.
                        </p>
                    </div>

                    <div className="database-hero-actions">
                        <button type="button" className="btn account-secondary-btn" onClick={refreshUsers}>
                            Refresh data
                        </button>
                        <Link to="/account" className="btn auth-submit-btn">
                            Back to account
                        </Link>
                    </div>
                </div>

                <div className="row g-4 mt-1">
                    <div className="col-md-4">
                        <div className="account-stat-card h-100">
                            <strong>{users.length}</strong>
                            <span>Tổng user</span>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="account-stat-card h-100">
                            <strong>{adminCount}</strong>
                            <span>Admin accounts</span>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="account-stat-card h-100">
                            <strong>{travelerCount}</strong>
                            <span>Traveler accounts</span>
                        </div>
                    </div>
                </div>

                <div className="row g-4 mt-1">
                    <div className="col-lg-5">
                        <div className="database-json-card h-100">
                            <div className="database-json-header">
                                <h3>Database metadata</h3>
                                <span>{databaseInfo.name}</span>
                            </div>

                            <div className="account-system-panel">
                                <div>
                                    <span>Object store</span>
                                    <strong>{databaseInfo.store}</strong>
                                </div>
                                <div>
                                    <span>Admin hiện tại</span>
                                    <strong>{currentUser.fullName}</strong>
                                </div>
                                <div>
                                    <span>Lần truy cập gần nhất</span>
                                    <strong>{mostRecentLogin ? formatDateTime(mostRecentLogin.lastLoginAt) : "Chưa có dữ liệu"}</strong>
                                </div>
                            </div>

                            <pre className="database-json-preview">
{JSON.stringify(
    {
        database: databaseInfo.name,
        store: databaseInfo.store,
        activeAdmin: currentUser.email,
        users,
    },
    null,
    2,
)}
                            </pre>
                        </div>
                    </div>

                    <div className="col-lg-7">
                        <div className="database-table-card h-100">
                            <div className="database-table-header">
                                <h3>Registered users</h3>
                                <span>{users.length} record(s)</span>
                            </div>

                            <div className="table-responsive">
                                <table className="table database-table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Phone</th>
                                            <th>Created</th>
                                            <th>Last login</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="database-user-cell">
                                                        <span className="database-user-avatar">{user.initials}</span>
                                                        <div>
                                                            <strong>{user.fullName}</strong>
                                                            <span>{user.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`database-role-badge ${user.role === "admin" ? "admin" : "traveler"}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>{user.phone || "N/A"}</td>
                                                <td>{formatDateTime(user.createdAt)}</td>
                                                <td>{formatDateTime(user.lastLoginAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UserDatabase;
