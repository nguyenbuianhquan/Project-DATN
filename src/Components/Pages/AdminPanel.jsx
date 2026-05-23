import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "../../Context/AdminContext";
import { updateOrderStatus, deleteUserById, updateUserRole, toggleUserLock, resetUserPassword, getRegisteredUsers, getOrders } from "../../lib/authStorage";
import toursJson from "../../../src/Data/Tours.json";
import hotelsJson from "../../../src/Data/Hotel.json";
import transportJson from "../../../src/Data/Transport.json";
import restaurantJson from "../../../src/Data/Restaurant.json";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── Helpers ──────────────────────────────────────────────────────
const loadData = (key, fallback) => {
    try {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : fallback;
    } catch { return fallback; }
};
const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const fmtDate     = (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "—";
const fmtVND      = (n) => Math.round(n).toLocaleString('vi-VN') + ' ₫';
const fmtVNDShort = (n) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' tỷ ₫';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2).replace('.', ',') + ' tr.₫';
    return fmtVND(n);
};

// ── Modal ─────────────────────────────────────────────────────────
const Modal = ({ title, onClose, onSave, children }) => (
    <div className="adm-modal-overlay" onClick={onClose}>
        <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
                <span className="adm-modal-title">{title}</span>
                <button className="adm-modal-close" onClick={onClose}>
                    <i className="ri-close-line"></i>
                </button>
            </div>
            <div className="adm-modal-body">{children}</div>
            <div className="adm-modal-footer">
                <button className="adm-cancel-btn" onClick={onClose}>Hủy</button>
                <button className="adm-save-btn" onClick={onSave}>
                    <i className="ri-save-line"></i> Lưu
                </button>
            </div>
        </div>
    </div>
);

// ── Confirm dialog ────────────────────────────────────────────────
const Confirm = ({ message, onConfirm, onCancel }) => (
    <div className="adm-confirm-overlay">
        <div className="adm-confirm-box">
            <div className="adm-confirm-icon"><i className="ri-error-warning-line"></i></div>
            <div className="adm-confirm-title">Xác nhận xóa</div>
            <div className="adm-confirm-desc">{message}</div>
            <div className="adm-confirm-actions">
                <button className="adm-cancel-btn" onClick={onCancel}>Hủy</button>
                <button className="adm-delete-btn" onClick={onConfirm}>
                    <i className="ri-delete-bin-line"></i> Xóa
                </button>
            </div>
        </div>
    </div>
);

// ── Status + activity helpers ─────────────────────────────────────
const statusStyle = {
    confirmed:  { bg: "rgba(242,111,85,0.15)",  color: "#f26f55", border: "rgba(242,111,85,0.3)",  label: "Đã xác nhận" },
    cancelled:  { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", border: "rgba(239,68,68,0.3)",  label: "Đã hủy"      },
    pending:    { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.3)", label: "Chờ xử lý"   },
    completed:  { bg: "rgba(99,102,241,0.15)", color: "#6366f1", border: "rgba(99,102,241,0.3)", label: "Hoàn tất"    },
};
const getStatus = (s) => statusStyle[s] || statusStyle.pending;

const getActivity = (u) => {
    if (u.isLocked) return { label: "Đã khóa",        color: "#ef4444", pulse: false };
    return u.isOnline
        ? { label: "Đang sử dụng",  color: "#22c55e", pulse: true  }
        : { label: "Không sử dụng", color: "#6b7280", pulse: false };
};

// ── Chart: Sparkline ─────────────────────────────────────────────
const Sparkline = ({ data, color = "#f26f55" }) => {
    if (!data || data.every(v => v === 0)) return null;
    const max = Math.max(...data);
    const W = 72, H = 32, pad = 3;
    const step = (W - pad * 2) / Math.max(data.length - 1, 1);
    const pts = data.map((v, i) => `${pad + i * step},${H - pad - (v / max) * (H - pad * 2)}`).join(" ");
    const area = `${pad},${H} ${pts} ${pad + (data.length - 1) * step},${H}`;
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
            <defs>
                <linearGradient id="spk-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill="url(#spk-grad)" />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

// ── Chart: 7-day line chart ───────────────────────────────────────
const LineChart7Day = ({ orders }) => {
    const [hov, setHov] = useState(null);

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
    });
    const data = days.map(d => {
        const dayOrders = orders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === d.toDateString());
        return {
            short: d.toLocaleDateString("vi-VN", { weekday: "short" }),
            full:  d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
            revenue: dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
            count:   dayOrders.length,
        };
    });

    const W = 520, H = 210, PB = 42, PT = 16, PL = 58, PR = 16;
    const cW = W - PL - PR, cH = H - PB - PT;

    const maxRev   = Math.max(...data.map(d => d.revenue), 1);
    const maxCount = Math.max(...data.map(d => d.count),   1);

    const toXY = (idx, val, maxVal) => ({
        x: PL + (idx / (data.length - 1)) * cW,
        y: PT + (1 - val / maxVal) * cH,
    });

    const revPts   = data.map((d, i) => toXY(i, d.revenue, maxRev));
    const countPts = data.map((d, i) => toXY(i, d.count,   maxCount));

    const curvePath = (pts) => {
        if (pts.length < 2) return "";
        let p = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
            const cx = ((pts[i - 1].x + pts[i].x) / 2).toFixed(1);
            p += ` C ${cx} ${pts[i - 1].y.toFixed(1)}, ${cx} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
        }
        return p;
    };

    const areaPath = (pts) => {
        if (pts.length < 2) return "";
        const base = PT + cH;
        let p = `M ${pts[0].x.toFixed(1)} ${base} L ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
            const cx = ((pts[i - 1].x + pts[i].x) / 2).toFixed(1);
            p += ` C ${cx} ${pts[i - 1].y.toFixed(1)}, ${cx} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
        }
        return p + ` L ${pts[pts.length - 1].x.toFixed(1)} ${base} Z`;
    };

    const gridSteps = [0, 0.25, 0.5, 0.75, 1];

    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
                <defs>
                    <linearGradient id="lc-rev-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#f26f55" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#f26f55" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lc-cnt-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid */}
                {gridSteps.map(p => {
                    const y = PT + (1 - p) * cH;
                    return (
                        <g key={p}>
                            <line x1={PL} y1={y} x2={W - PR} y2={y}
                                stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <text x={PL - 6} y={y + 3.5} textAnchor="end"
                                fill="rgba(255,255,255,0.22)" fontSize={8.5}>
                                {fmtVNDShort(maxRev * p)}
                            </text>
                        </g>
                    );
                })}

                {/* Area fills */}
                <path d={areaPath(revPts)}   fill="url(#lc-rev-grad)" />
                <path d={areaPath(countPts)} fill="url(#lc-cnt-grad)" />

                {/* Lines */}
                <path d={curvePath(revPts)}   fill="none" stroke="#f26f55" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" />
                <path d={curvePath(countPts)} fill="none" stroke="#3b82f6" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" />

                {/* X-axis labels + hover */}
                {data.map((d, i) => {
                    const rp = revPts[i];
                    const cp = countPts[i];
                    const isToday = i === 6;
                    const isHov   = hov === i;
                    return (
                        <g key={i}>
                            <rect x={rp.x - 22} y={PT} width={44} height={cH + 2}
                                fill="transparent"
                                onMouseEnter={() => setHov(i)}
                                onMouseLeave={() => setHov(null)} />
                            <text x={rp.x} y={H - 24} textAnchor="middle"
                                fill={isToday ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)"}
                                fontSize={10} fontWeight={isToday ? "700" : "400"}>
                                {d.short}
                            </text>
                            <text x={rp.x} y={H - 10} textAnchor="middle"
                                fill="rgba(255,255,255,0.18)" fontSize={8}>
                                {d.full}
                            </text>

                            {isHov && (
                                <g>
                                    <line x1={rp.x} y1={PT} x2={rp.x} y2={PT + cH}
                                        stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 4" />
                                    <circle cx={rp.x} cy={rp.y} r={4.5} fill="#f26f55"
                                        stroke="rgba(12,15,24,1)" strokeWidth="2" />
                                    <circle cx={cp.x} cy={cp.y} r={4.5} fill="#3b82f6"
                                        stroke="rgba(12,15,24,1)" strokeWidth="2" />
                                    <rect x={rp.x - 58} y={PT + 2} width={116} height={40}
                                        fill="rgba(10,13,22,0.96)" rx={7}
                                        stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                    <text x={rp.x} y={PT + 17} textAnchor="middle"
                                        fill="#f26f55" fontSize={9.5} fontWeight="700">
                                        {d.revenue > 0 ? fmtVNDShort(d.revenue) : "0 ₫"}
                                    </text>
                                    <text x={rp.x} y={PT + 32} textAnchor="middle"
                                        fill="#3b82f6" fontSize={9}>
                                        {d.count} đơn hàng
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: 2 }}>
                {[
                    { color: "#f26f55", label: "Doanh thu" },
                    { color: "#3b82f6", label: "Số đơn hàng" },
                ].map(({ color, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width={24} height={10}>
                            <line x1={0} y1={5} x2={24} y2={5} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
                            <circle cx={12} cy={5} r={3} fill={color} />
                        </svg>
                        <span style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.45)" }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Chart: Donut ──────────────────────────────────────────────────
const DonutChart = ({ segments, total }) => {
    const size = 144, cx = 72, cy = 72, r = 52, inner = 33;
    let angle = -Math.PI / 2;
    const arcs = total > 0 ? segments.filter(s => s.value > 0).map(seg => {
        const pct = seg.value / total;
        const a1 = angle, a2 = angle + pct * 2 * Math.PI - 0.05;
        angle += pct * 2 * Math.PI;
        const lg = pct > 0.5 ? 1 : 0;
        const p = (a, rad) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
        const [x1, y1] = p(a1, r), [x2, y2] = p(a2, r);
        const [xi1, yi1] = p(a1, inner), [xi2, yi2] = p(a2, inner);
        return (
            <path key={seg.label}
                d={`M${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2} L${xi2},${yi2} A${inner},${inner} 0 ${lg} 0 ${xi1},${yi1} Z`}
                fill={seg.color} />
        );
    }) : null;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {total === 0
                ? <circle cx={cx} cy={cy} r={(r + inner) / 2} fill="none"
                    stroke="rgba(255,255,255,0.07)" strokeWidth={r - inner} />
                : arcs}
            <text x={cx} y={cy - 6} textAnchor="middle"
                fill="white" fontSize={24} fontWeight="800">{total}</text>
            <text x={cx} y={cy + 13} textAnchor="middle"
                fill="rgba(255,255,255,0.38)" fontSize={10}>đơn hàng</text>
        </svg>
    );
};

// ── Room editor (for hotel CRUD) ─────────────────────────────────
const RoomEditor = ({ rooms = [], onChange }) => {
    const empty = { name: '', size: 25, beds: '1 giường King', maxGuests: 2, price: 0, available: true, image: '', amenities: [] };
    const [adding, setAdding] = useState(false);
    const [nr, setNr] = useState(empty);

    const addRoom = () => {
        if (!nr.name.trim()) return;
        onChange([...rooms, { ...nr, id: `r${Date.now()}` }]);
        setNr(empty);
        setAdding(false);
    };
    const removeRoom = (id) => onChange(rooms.filter(r => r.id !== id));
    const toggleAvail = (id) => onChange(rooms.map(r => r.id === id ? { ...r, available: !r.available } : r));

    return (
        <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label className="adm-form-label">Danh sách phòng ({rooms.length} phòng)</label>
                {!adding && (
                    <button type="button" className="adm-add-btn" style={{ fontSize: '0.75rem', padding: '4px 12px' }} onClick={() => setAdding(true)}>
                        <i className="ri-add-line"></i> Thêm phòng
                    </button>
                )}
            </div>

            {rooms.map(r => (
                <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', marginBottom: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                    {r.image && <img src={r.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff' }}>{r.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                            {r.size}m² · {r.beds} · tối đa {r.maxGuests} khách · {fmtVND(r.price)}/đêm
                        </div>
                    </div>
                    <button type="button" title="Đổi trạng thái"
                        onClick={() => toggleAvail(r.id)}
                        style={{ fontSize: '0.68rem', padding: '2px 9px', borderRadius: 20, cursor: 'pointer', border: 'none',
                            background: r.available ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                            color: r.available ? '#22c55e' : '#ef4444',
                            outline: `1px solid ${r.available ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                        {r.available ? 'Còn phòng' : 'Hết phòng'}
                    </button>
                    <button type="button" className="adm-action-btn danger" onClick={() => removeRoom(r.id)}>
                        <i className="ri-delete-bin-line"></i>
                    </button>
                </div>
            ))}

            {rooms.length === 0 && !adding && (
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '10px 0' }}>Chưa có phòng nào — nhấn "Thêm phòng" để bắt đầu</p>
            )}

            {adding && (
                <div style={{ padding: '14px', background: 'rgba(242,111,85,0.04)', borderRadius: 10, border: '1px solid rgba(242,111,85,0.15)', marginTop: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#f26f55', marginBottom: 12 }}>
                        <i className="ri-door-open-line me-2"></i>Thông tin phòng mới
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="adm-form-label">Tên phòng *</label>
                            <input className="adm-form-input" placeholder="VD: Phòng Deluxe Hướng Biển"
                                value={nr.name} onChange={e => setNr(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="adm-form-label">Diện tích (m²)</label>
                            <input type="number" className="adm-form-input" min={1} value={nr.size}
                                onChange={e => setNr(p => ({ ...p, size: Number(e.target.value) }))} />
                        </div>
                        <div>
                            <label className="adm-form-label">Số khách tối đa</label>
                            <input type="number" className="adm-form-input" min={1} value={nr.maxGuests}
                                onChange={e => setNr(p => ({ ...p, maxGuests: Number(e.target.value) }))} />
                        </div>
                        <div>
                            <label className="adm-form-label">Loại giường</label>
                            <input className="adm-form-input" placeholder="VD: 1 giường King" value={nr.beds}
                                onChange={e => setNr(p => ({ ...p, beds: e.target.value }))} />
                        </div>
                        <div>
                            <label className="adm-form-label">Giá/đêm (₫)</label>
                            <input type="number" className="adm-form-input" min={0} value={nr.price}
                                onChange={e => setNr(p => ({ ...p, price: Number(e.target.value) }))} />
                        </div>
                        <div>
                            <label className="adm-form-label">Trạng thái</label>
                            <select className="adm-form-input" value={nr.available ? 'true' : 'false'}
                                onChange={e => setNr(p => ({ ...p, available: e.target.value === 'true' }))}>
                                <option value="true">Còn phòng</option>
                                <option value="false">Hết phòng</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="adm-form-label">URL ảnh phòng</label>
                            <input className="adm-form-input" placeholder="/Images/room.jpg" value={nr.image}
                                onChange={e => setNr(p => ({ ...p, image: e.target.value }))} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button type="button" className="adm-save-btn" onClick={addRoom}>
                            <i className="ri-check-line"></i> Thêm phòng
                        </button>
                        <button type="button" className="adm-cancel-btn" onClick={() => { setAdding(false); setNr(empty); }}>Hủy</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Overview tab ──────────────────────────────────────────────────
const OverviewTab = ({ users, orders }) => {
    const tours      = loadData("admin_tours",      toursJson);
    const hotels     = loadData("admin_hotels",     hotelsJson);
    const restaurant = loadData("admin_restaurant", restaurantJson);
    const transport  = loadData("admin_transport",  transportJson);

    const now          = new Date();
    const todayStr     = now.toDateString();
    const ydayStr      = new Date(now - 86400000).toDateString();

    const revenue      = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const todayOrders  = orders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === todayStr);
    const ydayRevenue  = orders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === ydayStr)
                               .reduce((s, o) => s + (Number(o.total) || 0), 0);
    const todayRevenue = todayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const completedCnt = orders.filter(o => o.status === "completed" || o.status === "confirmed").length;
    const completionRate = orders.length ? Math.round(completedCnt / orders.length * 100) : 0;
    const activeUsers  = users.filter(u => u.lastLoginAt && (Date.now() - new Date(u.lastLoginAt)) / 3600000 < 24);

    const sparkData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return orders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === d.toDateString())
                     .reduce((s, o) => s + (Number(o.total) || 0), 0);
    });

    const revDeltaRaw = ydayRevenue > 0
        ? ((todayRevenue - ydayRevenue) / ydayRevenue * 100).toFixed(0)
        : todayRevenue > 0 ? "+100" : null;
    const revDeltaNum = revDeltaRaw !== null ? Number(revDeltaRaw) : null;

    const donutSegments = [
        { label: "Đã xác nhận", value: orders.filter(o => o.status === "confirmed").length, color: "#f26f55" },
        { label: "Hoàn tất",    value: orders.filter(o => o.status === "completed").length, color: "#6366f1" },
        { label: "Chờ xử lý",  value: orders.filter(o => o.status === "pending").length,   color: "#f59e0b" },
        { label: "Đã hủy",     value: orders.filter(o => o.status === "cancelled").length,  color: "#ef4444" },
    ];

    const destMap = {};
    orders.forEach(o => { if (o.location) destMap[o.location] = (destMap[o.location] || 0) + (Number(o.total) || 0); });
    const topDest = Object.entries(destMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
    const maxDest = topDest[0]?.value || 1;

    const kpi = [
        {
            icon: "ri-money-dollar-circle-line", label: "Tổng doanh thu",
            value: fmtVNDShort(revenue), sub: "Tất cả thời gian",
            color: "#f26f55", bg: "rgba(242,111,85,0.08)", border: "rgba(242,111,85,0.18)",
            sparkline: true,
        },
        {
            icon: "ri-shopping-bag-3-line", label: "Đơn hôm nay",
            value: todayOrders.length, sub: `${orders.length} tổng đơn`,
            color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.18)",
        },
        {
            icon: "ri-funds-line", label: "Doanh thu hôm nay",
            value: fmtVNDShort(todayRevenue),
            sub: revDeltaNum !== null
                ? `${revDeltaNum >= 0 ? "↑" : "↓"} ${Math.abs(revDeltaNum)}% so với hôm qua`
                : "Chưa có dữ liệu hôm qua",
            subColor: revDeltaNum !== null ? (revDeltaNum >= 0 ? "#22c55e" : "#ef4444") : undefined,
            color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.18)",
        },
        {
            icon: "ri-checkbox-circle-line", label: "Tỷ lệ hoàn thành",
            value: `${completionRate}%`, sub: `${completedCnt} / ${orders.length} đơn`,
            color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.18)",
        },
    ];

    const serviceStats = [
        { icon: "ri-compass-3-line",  label: "Tours",       num: tours.length,      color: "#8b5cf6" },
        { icon: "ri-hotel-line",      label: "Khách sạn",   num: hotels.length,     color: "#f59e0b" },
        { icon: "ri-car-line",        label: "Phương tiện", num: transport.length,  color: "#3b82f6" },
        { icon: "ri-restaurant-line", label: "Nhà hàng",    num: restaurant.length, color: "#22c55e" },
        { icon: "ri-team-line",       label: "Người dùng",  num: users.length,      color: "#f26f55" },
        { icon: "ri-user-follow-line",label: "Online 24h",  num: activeUsers.length,color: "#06b6d4" },
    ];

    return (
        <>
            {/* ── KPI cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                {kpi.map(card => (
                    <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 14, padding: "1.1rem 1.2rem 1rem", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: card.color, borderRadius: "14px 0 0 14px" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</div>
                                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 5 }}>{card.value}</div>
                                <div style={{ fontSize: "0.7rem", color: card.subColor || "rgba(255,255,255,0.3)", fontWeight: 500 }}>{card.sub}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${card.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <i className={card.icon} style={{ color: card.color, fontSize: "1rem" }} />
                                </div>
                                {card.sparkline && <Sparkline data={sparkData} color={card.color} />}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Service counts ── */}
            <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                {serviceStats.map(s => (
                    <div key={s.label} style={{ flex: "1 1 90px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "0.65rem 0.9rem", display: "flex", alignItems: "center", gap: 9 }}>
                        <i className={s.icon} style={{ color: s.color, fontSize: "1rem", flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{s.num}</div>
                            <div style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.38)" }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Charts row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1rem", marginBottom: "1.25rem" }}>
                {/* Line chart */}
                <div className="adm-card" style={{ margin: 0 }}>
                    <div className="adm-card-header">
                        <span className="adm-card-title"><i className="ri-line-chart-line me-2"></i>Doanh thu 7 ngày gần nhất</span>
                        <span style={{ fontSize: "0.75rem", color: "#f26f55", fontWeight: 700 }}>{fmtVNDShort(revenue)} tổng</span>
                    </div>
                    <div style={{ padding: "0.25rem 0.75rem 0.75rem" }}>
                        {orders.length === 0
                            ? <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "0.8rem", padding: "2rem 0" }}>Chưa có dữ liệu doanh thu</div>
                            : <LineChart7Day orders={orders} />
                        }
                    </div>
                </div>

                {/* Donut chart */}
                <div className="adm-card" style={{ margin: 0 }}>
                    <div className="adm-card-header">
                        <span className="adm-card-title"><i className="ri-pie-chart-2-line me-2"></i>Phân bổ đơn</span>
                    </div>
                    <div style={{ padding: "0.75rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.9rem" }}>
                        <DonutChart segments={donutSegments} total={orders.length} />
                        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 9 }}>
                            {donutSegments.map(s => (
                                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
                                        <span style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.55)" }}>{s.label}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: s.color }}>{s.value}</span>
                                        {orders.length > 0 && (
                                            <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.25)", minWidth: 28, textAlign: "right" }}>
                                                {Math.round(s.value / orders.length * 100)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Recent orders */}
                <div className="adm-card" style={{ margin: 0 }}>
                    <div className="adm-card-header">
                        <span className="adm-card-title"><i className="ri-history-line me-2"></i>Đơn hàng gần đây</span>
                    </div>
                    {orders.length === 0 ? (
                        <p style={{ padding: "1.5rem", color: "rgba(255,255,255,0.22)", textAlign: "center", fontSize: "0.82rem" }}>Chưa có đơn đặt nào</p>
                    ) : (
                        <div style={{ padding: "0.25rem 0.65rem 0.75rem" }}>
                            {orders.slice(0, 5).map(o => {
                                const st = statusStyle[o.status] || statusStyle.pending;
                                return (
                                    <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.55rem 0.65rem", borderRadius: 9, marginBottom: 5, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div className="adm-user-avatar" style={{ fontSize: "0.7rem", flexShrink: 0 }}>
                                            {(o.userName || "?").split(" ").pop()[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: "0.79rem", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.userName || "Khách vãng lai"}</div>
                                            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.32)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.location || "—"}</div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f26f55", marginBottom: 2 }}>{fmtVNDShort(Number(o.total || 0))}</div>
                                            <span style={{ fontSize: "0.63rem", fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Top destinations */}
                <div className="adm-card" style={{ margin: 0 }}>
                    <div className="adm-card-header">
                        <span className="adm-card-title"><i className="ri-map-pin-line me-2"></i>Top điểm đến</span>
                    </div>
                    <div style={{ padding: "0.75rem 1rem 1rem" }}>
                        {topDest.length === 0 ? (
                            <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "0.82rem", textAlign: "center", padding: "1.25rem 0" }}>Chưa có dữ liệu</p>
                        ) : topDest.map((d, i) => (
                            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < topDest.length - 1 ? 15 : 0 }}>
                                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(242,111,85,0.12)", border: "1px solid rgba(242,111,85,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", color: "#f26f55", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                                        <span style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.65)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" }}>{d.label}</span>
                                        <span style={{ fontSize: "0.73rem", color: "#f26f55", fontWeight: 700, flexShrink: 0 }}>{fmtVNDShort(d.value)}</span>
                                    </div>
                                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${(d.value / maxDest) * 100}%`, background: `hsl(${10 + i * 28}, 75%, 58%)`, borderRadius: 3 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

// ── Users tab ─────────────────────────────────────────────────────
const UsersTab = ({ users, currentUserId, onDelete, onChangeRole, onToggleLock }) => {
    const [search, setSearch] = useState("");
    const [resetingId, setResetingId] = useState(null);

    const handleSendReset = async (u) => {
        setResetingId(u.id);
        try {
            await resetUserPassword(u.email);
            toast.success(`Đã gửi link đặt lại mật khẩu tới ${u.email}`);
        } catch (err) {
            toast.error(err.message || "Gửi email thất bại.");
        } finally {
            setResetingId(null);
        }
    };
    const adminCount = users.filter(u => u.role === "admin").length;
    const filtered = users.filter(u =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="adm-card">
            <div className="adm-card-header">
                <span className="adm-card-title">
                    <i className="ri-team-line me-2"></i>Người dùng ({users.length})
                </span>
                <input
                    className="adm-search"
                    placeholder="Tìm tên / email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="table-responsive">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>Người dùng</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Đăng nhập gần nhất</th>
                            <th>Điện thoại</th>
                            <th>Thành phố</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(u => {
                            const isSelf = u.id === currentUserId;
                            const isLastAdmin = u.role === "admin" && adminCount === 1;
                            const canAct = !isSelf && !isLastAdmin;
                            const act = getActivity(u);
                            return (
                                <tr key={u.id} style={u.isLocked ? { opacity: 0.55 } : {}}>
                                    <td>
                                        <div className="adm-user-cell">
                                            <div className="adm-user-avatar" style={{ position: "relative", ...(u.isLocked ? { background: "#ef444422", border: "1px solid #ef4444" } : {}) }}>
                                                {u.initials}
                                                <span className={`adm-status-dot${act.pulse ? " adm-pulse" : ""}`} style={{ background: act.color }}></span>
                                            </div>
                                            <div>
                                                <div className="adm-user-name">
                                                    {u.fullName}
                                                    {isSelf && <span className="adm-self-tag"> (bạn)</span>}
                                                </div>
                                                <div className="adm-user-email">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className={`adm-role-badge ${u.role}`}>{u.role === "admin" ? "Admin" : "Traveler"}</span></td>
                                    <td>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: act.color, fontWeight: 600 }}>
                                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: act.color, display: "inline-block", flexShrink: 0 }}></span>
                                            {act.label}
                                        </span>
                                        {u.isLocked && <span style={{ display: "block", fontSize: "0.72rem", color: "#ef4444", marginTop: 2 }}><i className="ri-lock-fill me-1"></i>Đã khóa</span>}
                                    </td>
                                    <td style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{fmtDate(u.lastLoginAt) || "—"}</td>
                                    <td>{u.phone || "—"}</td>
                                    <td>{u.homeCity || "—"}</td>
                                    <td>{fmtDate(u.createdAt)}</td>
                                    <td>
                                        <button
                                            className="adm-action-btn info"
                                            title="Gửi email đặt lại mật khẩu"
                                            disabled={resetingId === u.id}
                                            onClick={() => handleSendReset(u)}
                                        >
                                            {resetingId === u.id
                                                ? <i className="ri-loader-4-line adm-spin"></i>
                                                : <i className="ri-mail-send-line"></i>
                                            }
                                        </button>
                                        {canAct && (
                                            <button
                                                className="adm-action-btn success"
                                                title={u.role === "admin" ? "Hạ xuống Traveler" : "Thăng lên Admin"}
                                                onClick={() => onChangeRole(u.id, u.role === "admin" ? "traveler" : "admin")}
                                            >
                                                <i className={`ri-arrow-${u.role === "admin" ? "down" : "up"}-line`}></i>
                                            </button>
                                        )}
                                        {canAct && (
                                            <button
                                                className={`adm-action-btn ${u.isLocked ? "success" : "warn"}`}
                                                title={u.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                                onClick={() => onToggleLock(u.id, !u.isLocked)}
                                            >
                                                <i className={`ri-${u.isLocked ? "lock-unlock-line" : "lock-line"}`}></i>
                                            </button>
                                        )}
                                        {canAct && (
                                            <button
                                                className="adm-action-btn danger"
                                                title="Xóa người dùng"
                                                onClick={() => onDelete(u)}
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        )}
                                        {!canAct && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}></span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ── Generic CRUD tab ──────────────────────────────────────────────
const CrudTab = ({ config }) => {
    const { title, storageKey, fallbackData, columns, formFields, defaultItem, entityName } = config;
    const [items, setItems]     = useState(() => loadData(storageKey, fallbackData));
    const [modal, setModal]     = useState(null);
    const [form, setForm]       = useState({});
    const [confirm, setConfirm] = useState(null);
    const [search, setSearch]   = useState("");

    const filtered = items.filter(item =>
        Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
    );

    const openAdd = () => { setForm({ ...defaultItem }); setModal({ mode: "add" }); };
    const openEdit = (item) => { setForm({ ...item }); setModal({ mode: "edit", item }); };
    const closeModal = () => setModal(null);

    const handleSave = () => {
        let updated;
        if (modal.mode === "add") {
            updated = [{ ...form, id: Date.now() }, ...items];
            toast.success(`Đã thêm ${entityName} mới!`);
        } else {
            updated = items.map(i => i.id === modal.item.id ? { ...i, ...form } : i);
            toast.success("Đã cập nhật thành công!");
        }
        setItems(updated);
        saveData(storageKey, updated);
        closeModal();
    };

    const confirmDelete = () => {
        const updated = items.filter(i => i.id !== confirm.id);
        setItems(updated);
        saveData(storageKey, updated);
        setConfirm(null);
        toast.success("Đã xóa thành công!");
    };

    const handleReset = () => {
        localStorage.removeItem(storageKey);
        setItems(fallbackData);
        toast.info("Đã khôi phục dữ liệu gốc");
    };

    const setField = (key, value, isNumber) =>
        setForm(p => ({ ...p, [key]: isNumber ? Number(value) : value }));

    return (
        <>
            <div className="adm-card">
                <div className="adm-card-header">
                    <span className="adm-card-title">{title} ({items.length})</span>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                            className="adm-search"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button className="adm-add-btn" onClick={openAdd}>
                            <i className="ri-add-line"></i> Thêm mới
                        </button>
                        <button className="adm-reset-btn" onClick={handleReset} title="Khôi phục dữ liệu gốc">
                            <i className="ri-refresh-line"></i>
                        </button>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Ảnh</th>
                                {columns.map(c => <th key={c.key}>{c.label}</th>)}
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        {item.image && (
                                            <img src={item.image} alt="" className="adm-thumb" />
                                        )}
                                    </td>
                                    {columns.map(c => (
                                        <td key={c.key}>
                                            {c.render ? c.render(item[c.key]) : (item[c.key] ?? "—")}
                                        </td>
                                    ))}
                                    <td>
                                        <button className="adm-action-btn" title="Sửa" onClick={() => openEdit(item)}>
                                            <i className="ri-pencil-line"></i>
                                        </button>
                                        <button className="adm-action-btn danger" title="Xóa" onClick={() => setConfirm(item)}>
                                            <i className="ri-delete-bin-line"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length + 2} style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.3)" }}>
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal
                    title={modal.mode === "add" ? `Thêm ${entityName}` : `Sửa ${entityName}`}
                    onClose={closeModal}
                    onSave={handleSave}
                >
                    <div className="adm-modal-grid">
                        {formFields.map(f => (
                            <div
                                key={f.key}
                                className="adm-form-field"
                                style={f.fullWidth ? { gridColumn: "1 / -1" } : {}}
                            >
                                {f.type !== "rooms" && <label className="adm-form-label">{f.label}{f.required && " *"}</label>}
                                {f.type === "rooms" ? (
                                    <RoomEditor
                                        rooms={form[f.key] || []}
                                        onChange={val => setForm(p => ({ ...p, [f.key]: val }))}
                                    />
                                ) : f.type === "select" ? (
                                    <select
                                        className="adm-form-input"
                                        value={form[f.key] ?? ""}
                                        onChange={e => setField(f.key, e.target.value, false)}
                                    >
                                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type={f.type || "text"}
                                        className="adm-form-input"
                                        value={form[f.key] ?? ""}
                                        placeholder={f.placeholder || ""}
                                        onChange={e => setField(f.key, e.target.value, f.type === "number")}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </Modal>
            )}

            {confirm && (
                <Confirm
                    message={`Bạn có chắc muốn xóa "${confirm.title || confirm.name}"?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </>
    );
};

// ── Orders tab ────────────────────────────────────────────────────
const OrdersTab = () => {
    const { firebaseReady } = useAdmin();
    const [orders,       setOrders]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [search,       setSearch]       = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expand,       setExpand]       = useState(null);
    const [updating,     setUpdating]     = useState(null);
    const prevCount = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const list = await getOrders();
                setOrders(list);
            } catch (err) {
                console.error("OrdersTab load error:", err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdating(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            toast.success("Đã cập nhật trạng thái đơn hàng!");
        } catch {
            toast.error("Cập nhật thất bại, thử lại!");
        } finally {
            setUpdating(null);
        }
    };

    const filtered = orders
        .filter(o => statusFilter === "all" || o.status === statusFilter)
        .filter(o =>
            [o.userName, o.userEmail, o.location].some(v =>
                (v || "").toLowerCase().includes(search.toLowerCase())
            )
        );

    const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);

    return (
        <div className="adm-card">
            <div className="adm-card-header">
                <span className="adm-card-title" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <i className="ri-shopping-bag-3-line me-2"></i>
                    Đơn đặt tour ({orders.length})
                    <span style={{ fontSize: "0.8rem", color: "#f26f55", fontWeight: 700 }}>
                        · {fmtVNDShort(totalRevenue)}
                    </span>
                </span>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <select
                        className="adm-search"
                        style={{ width: "auto", paddingRight: "0.75rem" }}
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="completed">Hoàn tất</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                    <input
                        className="adm-search"
                        placeholder="Tìm tên / email / điểm đến..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <p style={{ padding: "2rem", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                    Đang tải đơn hàng...
                </p>
            ) : (
                <div className="table-responsive">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Khách hàng</th>
                                <th>Điểm đến</th>
                                <th>Ngày đi</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Thời gian đặt</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(o => {
                                const st = getStatus(o.status);
                                return (
                                    <React.Fragment key={o.id}>
                                        <tr
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setExpand(expand === o.id ? null : o.id)}
                                        >
                                            <td>
                                                <div className="adm-user-cell">
                                                    <div className="adm-user-avatar" style={{ fontSize: "0.75rem" }}>
                                                        {(o.userName || "?").split(" ").pop()[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="adm-user-name">{o.userName || "Khách vãng lai"}</div>
                                                        <div className="adm-user-email">{o.userEmail || "—"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{o.location || "—"}</td>
                                            <td>{o.date || "—"}{o.checkOut ? ` → ${o.checkOut}` : ""}</td>
                                            <td style={{ color: "#f26f55", fontWeight: 700 }}>
                                                {fmtVND(Number(o.total || 0))}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>
                                                {o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "—"}
                                            </td>
                                            <td onClick={e => e.stopPropagation()} style={{ whiteSpace: "nowrap" }}>
                                                <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                                                    {updating === o.id ? (
                                                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                                                            <span className="af-spinner" style={{ width: 12, height: 12, borderWidth: 2, marginRight: 4 }}></span>
                                                            Đang xử lý...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {o.status === "pending" && (
                                                                <button
                                                                    className="adm-order-action-btn confirm"
                                                                    onClick={() => handleStatusChange(o.id, "confirmed")}
                                                                >
                                                                    <i className="ri-check-line"></i> Xác nhận
                                                                </button>
                                                            )}
                                                            {o.status === "confirmed" && (
                                                                <button
                                                                    className="adm-order-action-btn complete"
                                                                    onClick={() => handleStatusChange(o.id, "completed")}
                                                                >
                                                                    <i className="ri-checkbox-circle-line"></i> Hoàn tất
                                                                </button>
                                                            )}
                                                            {o.status === "cancelled" && (
                                                                <button
                                                                    className="adm-order-action-btn restore"
                                                                    onClick={() => handleStatusChange(o.id, "pending")}
                                                                >
                                                                    <i className="ri-restart-line"></i> Khôi phục
                                                                </button>
                                                            )}
                                                            {o.status !== "cancelled" && o.status !== "completed" && (
                                                                <button
                                                                    className="adm-order-action-btn cancel"
                                                                    onClick={() => handleStatusChange(o.id, "cancelled")}
                                                                >
                                                                    <i className="ri-close-circle-line"></i> Hủy
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expand === o.id && (
                                            <tr>
                                                <td colSpan={7} style={{ background: "rgba(255,255,255,0.03)", padding: "12px 20px" }}>
                                                    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                                                        <span><b>Tạm tính:</b> {fmtVND(Number(o.subTotal || 0))}</span>
                                                        <span><b>Thuế & phí:</b> {fmtVND(Number(o.tax || 0))}</span>
                                                        <span><b>Phương thức:</b> {o.paymentMethod || "—"}</span>
                                                        {(o.items || []).map((it, idx) => (
                                                            <span key={idx}><b>{it.name}:</b> {fmtVND(Number(it.price || 0))}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {filtered.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.3)" }}>
                                        Chưa có đơn đặt nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ── CRUD configs ──────────────────────────────────────────────────
const toursConfig = {
    title: "Tours", storageKey: "admin_tours", fallbackData: toursJson, entityName: "tour",
    columns: [
        { key: "title",    label: "Tên tour" },
        { key: "location", label: "Điểm đến" },
        { key: "duration", label: "Thời gian" },
        { key: "price",    label: "Giá",    render: v => fmtVND(v) },
        { key: "rating",   label: "Rating" },
    ],
    formFields: [
        { key: "title",    label: "Tên tour",                  required: true, fullWidth: true },
        { key: "location", label: "Điểm đến",                  required: true },
        { key: "duration", label: "Thời gian (vd: 3 Days 2 Night)" },
        { key: "persons",  label: "Số người (vd: 2 Person)" },
        { key: "price",    label: "Giá (₫)",    type: "number", required: true },
        { key: "rating",   label: "Rating",     type: "number" },
        { key: "reviews",  label: "Đánh giá",   type: "number" },
        { key: "image",    label: "URL ảnh",                   fullWidth: true },
    ],
    defaultItem: { title: "", location: "", duration: "1 Day", persons: "2 Person", price: 0, rating: 4.5, reviews: 0, image: "", tag: "Featured" },
};

const hotelsConfig = {
    title: "Khách sạn", storageKey: "admin_hotels", fallbackData: hotelsJson, entityName: "khách sạn",
    columns: [
        { key: "name",     label: "Tên" },
        { key: "location", label: "Địa điểm" },
        { key: "rating",   label: "Rating" },
        { key: "price",    label: "Giá/đêm", render: v => fmtVND(v) },
        { key: "rooms",    label: "Phòng", render: v => `${(v || []).length} phòng` },
    ],
    formFields: [
        { key: "name",        label: "Tên khách sạn", required: true, fullWidth: true },
        { key: "location",    label: "Địa điểm",       required: true },
        { key: "rating",      label: "Rating",         type: "number" },
        { key: "reviews",     label: "Đánh giá",       type: "number" },
        { key: "price",       label: "Giá khởi điểm (₫)", type: "number", required: true },
        { key: "description", label: "Mô tả",          fullWidth: true },
        { key: "image",       label: "URL ảnh",        fullWidth: true },
        { key: "rooms",       label: "Phòng ngủ",      type: "rooms",  fullWidth: true },
    ],
    defaultItem: { name: "", location: "", rating: 4.5, reviews: 0, price: 0, description: "", image: "", facilities: [], featured: false, rooms: [] },
};

const transportConfig = {
    title: "Phương tiện", storageKey: "admin_transport", fallbackData: transportJson, entityName: "phương tiện",
    columns: [
        { key: "name",         label: "Tên xe" },
        { key: "location",     label: "Địa điểm" },
        { key: "transmission", label: "Hộp số" },
        { key: "seats",        label: "Chỗ ngồi" },
        { key: "price",        label: "Giá/ngày", render: v => fmtVND(v) },
    ],
    formFields: [
        { key: "name",         label: "Tên xe",         required: true, fullWidth: true },
        { key: "location",     label: "Địa điểm",       required: true },
        { key: "mileage",      label: "Số km (vd: 6542 Miles)" },
        { key: "transmission", label: "Hộp số",         type: "select", options: ["Automatic", "Manual"] },
        { key: "seats",        label: "Số chỗ",         type: "number" },
        { key: "trips",        label: "Số chuyến",      type: "number" },
        { key: "rating",       label: "Rating",         type: "number" },
        { key: "reviews",      label: "Đánh giá",       type: "number" },
        { key: "price",        label: "Giá/ngày (₫)",   type: "number", required: true },
        { key: "image",        label: "URL ảnh",        fullWidth: true },
    ],
    defaultItem: { name: "", location: "", mileage: "0 Miles", transmission: "Automatic", seats: 4, trips: 0, rating: 4.5, reviews: 0, price: 0, image: "" },
};

const restaurantConfig = {
    title: "Nhà hàng", storageKey: "admin_restaurant", fallbackData: restaurantJson, entityName: "nhà hàng",
    columns: [
        { key: "title",    label: "Tên" },
        { key: "location", label: "Địa điểm" },
        { key: "tag",      label: "Loại" },
        { key: "price",    label: "Giá/bữa", render: v => fmtVND(v) },
        { key: "rating",   label: "Rating" },
    ],
    formFields: [
        { key: "title",    label: "Tên nhà hàng",              required: true, fullWidth: true },
        { key: "location", label: "Địa điểm",                  required: true },
        { key: "tag",      label: "Loại (Popular / New / Featured)" },
        { key: "price",    label: "Giá/bữa (₫)", type: "number", required: true },
        { key: "oldPrice", label: "Giá gốc (₫)", type: "number" },
        { key: "rating",   label: "Rating",      type: "number" },
        { key: "reviews",  label: "Đánh giá",    type: "number" },
        { key: "image",    label: "URL ảnh",                   fullWidth: true },
    ],
    defaultItem: { title: "", location: "", tag: "Popular", price: 0, oldPrice: 0, rating: 4.5, reviews: 0, image: "" },
};

// ── Admin login form (shown when no session) ─────────────────────
const AdminLoginForm = () => {
    const { adminLogin } = useAdmin();
    const [form,        setForm]        = useState({ email: "", password: "" });
    const [error,       setError]       = useState("");
    const [submitting,  setSubmitting]  = useState(false);
    const [showPass,    setShowPass]    = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await adminLogin(form);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,#0d1117 0%,#161b22 100%)",
        }}>
            <div style={{
                width: "100%", maxWidth: 380,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "2.5rem 2rem", boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{ fontSize: "2rem", color: "#f26f55", marginBottom: "0.5rem" }}>
                        <i className="ri-shield-star-fill"></i>
                    </div>
                    <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "1.4rem", margin: 0 }}>Admin Portal</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: 4 }}>
                        DAYTRIP · Quản trị viên
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 8, padding: "0.65rem 0.9rem", marginBottom: "1.25rem",
                        color: "#f87171", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <i className="ri-error-warning-line"></i> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
                        <div style={{ position: "relative" }}>
                            <i className="ri-mail-line" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }}></i>
                            <input
                                type="email" required autoComplete="email"
                                placeholder="admin@daytrip.vn"
                                value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                style={{
                                    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 8, padding: "0.65rem 0.75rem 0.65rem 2.4rem", color: "#fff", fontSize: "0.9rem",
                                    outline: "none", boxSizing: "border-box",
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mật khẩu</label>
                        <div style={{ position: "relative" }}>
                            <i className="ri-lock-line" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }}></i>
                            <input
                                type={showPass ? "text" : "password"} required autoComplete="current-password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                style={{
                                    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 8, padding: "0.65rem 2.4rem 0.65rem 2.4rem", color: "#fff", fontSize: "0.9rem",
                                    outline: "none", boxSizing: "border-box",
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(p => !p)}
                                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}
                            >
                                <i className={`ri-${showPass ? "eye-off" : "eye"}-line`}></i>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit" disabled={submitting}
                        style={{
                            width: "100%", padding: "0.75rem", borderRadius: 8, border: "none",
                            background: submitting ? "rgba(242,111,85,0.5)" : "#f26f55",
                            color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: submitting ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                    >
                        {submitting
                            ? <><span className="af-spinner"></span>Đang xác thực...</>
                            : <><i className="ri-login-box-line"></i>Đăng nhập Admin</>
                        }
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.25)" }}>
                    Chỉ tài khoản có vai trò <strong style={{ color: "rgba(255,255,255,0.4)" }}>Admin</strong> mới được truy cập
                </p>
            </div>
        </div>
    );
};

// ── Main AdminPanel ───────────────────────────────────────────────
const AdminPanel = () => {
    const { adminUser, adminLogout, firebaseReady } = useAdmin();
    const [tab,          setTab]         = useState("overview");
    const [users,        setUsers]       = useState([]);
    const [orders,       setOrders]      = useState([]);
    const [newOrderBadge, setNewOrderBadge] = useState(0);
    const [confirmUser, setConfirmUser] = useState(null);
    const prevOrderCount = useRef(null);

    // Load users
    useEffect(() => {
        if (!adminUser) return;
        getRegisteredUsers().then(setUsers).catch(err => console.warn("load users:", err.message));
    }, [adminUser]);

    // Load orders (for overview + badge)
    useEffect(() => {
        if (!adminUser) return;
        getOrders().then(list => {
            if (prevOrderCount.current !== null && list.length > prevOrderCount.current && tab !== "orders") {
                setNewOrderBadge(b => b + (list.length - prevOrderCount.current));
            }
            prevOrderCount.current = list.length;
            setOrders(list);
        }).catch(() => {});
    }, [adminUser, tab]);

    // Real-time SSE: nhận push khi có user đăng ký / đăng nhập
    useEffect(() => {
        if (!adminUser) return;
        const token = localStorage.getItem("daytrip-token");
        if (!token) return;

        const es = new EventSource(
            `http://localhost:3001/api/users/events?token=${encodeURIComponent(token)}`
        );

        es.addEventListener("user_registered", (e) => {
            const data = JSON.parse(e.data);
            toast.success(
                `Tài khoản mới: ${data.fullName}`,
                { icon: "👤", autoClose: 5000 }
            );
            getRegisteredUsers().then(setUsers).catch(() => {});
        });

        es.addEventListener("user_login", (e) => {
            const data = JSON.parse(e.data);
            toast.info(`${data.fullName} vừa đăng nhập`, { autoClose: 3000 });
            getRegisteredUsers().then(setUsers).catch(() => {});
        });

        es.onerror = () => { /* trình duyệt tự reconnect */ };

        return () => es.close();
    }, [adminUser]);

    if (!adminUser) return <AdminLoginForm />;

    const handleDeleteUser = (user) => setConfirmUser(user);

    const confirmDeleteUser = async () => {
        await deleteUserById(confirmUser.id);
        setConfirmUser(null);
        toast.success("Đã xóa người dùng!");
    };

    const handleChangeRole = async (userId, newRole) => {
        await updateUserRole(userId, newRole);
        toast.success("Đã cập nhật vai trò!");
    };

    const handleToggleLock = async (userId, isLocked) => {
        await toggleUserLock(userId, isLocked);
        toast.success(isLocked ? "Đã khóa tài khoản!" : "Đã mở khóa tài khoản!");
    };

    const handleAdminLogout = () => {
        adminLogout();
        toast.info("Đã đăng xuất admin");
    };

    const changeTab = (id) => {
        setTab(id);
        if (id === "orders") setNewOrderBadge(0);
    };

    const navItems = [
        { id: "overview",    label: "Tổng quan",     icon: "ri-dashboard-line" },
        { id: "orders",      label: "Đặt tour",      icon: "ri-shopping-bag-3-line", badge: newOrderBadge },
        { id: "users",       label: "Người dùng",    icon: "ri-team-line" },
        { id: "tours",       label: "Tours",          icon: "ri-compass-3-line" },
        { id: "hotels",      label: "Khách sạn",     icon: "ri-hotel-line" },
        { id: "transport",   label: "Phương tiện",   icon: "ri-car-line" },
        { id: "restaurant",  label: "Nhà hàng",      icon: "ri-restaurant-line" },
    ];

    const currentNav = navItems.find(n => n.id === tab);

    return (
        <div className="adm-layout">
            <ToastContainer position="top-right" autoClose={2000} theme="dark" />

            {/* Sidebar */}
            <aside className="adm-sidebar">
                <div className="adm-sidebar-brand">
                    <i className="ri-shield-star-fill"></i>
                    Admin
                </div>
                <div className="adm-sidebar-label">Quản lý</div>
                {navItems.map(n => (
                    <button
                        key={n.id}
                        className={`adm-nav-item ${tab === n.id ? "active" : ""}`}
                        onClick={() => changeTab(n.id)}
                        style={{ position: "relative" }}
                    >
                        <i className={n.icon}></i>
                        {n.label}
                        {n.badge > 0 && (
                            <span className="adm-nav-badge">{n.badge}</span>
                        )}
                    </button>
                ))}
                <div className="adm-sidebar-footer">
                    <Link to="/" className="adm-nav-item" style={{ textDecoration: "none" }}>
                        <i className="ri-arrow-left-line"></i>
                        Về trang chủ
                    </Link>
                    <button className="adm-nav-item" style={{ color: "#f87171" }} onClick={handleAdminLogout}>
                        <i className="ri-logout-box-line"></i>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="adm-main">
                <div className="adm-topbar">
                    <div>
                        <div className="adm-topbar-title">
                            <i className={`${currentNav?.icon} me-2`}></i>
                            {currentNav?.label}
                        </div>
                        <div className="adm-topbar-sub">DAYTRIP · Admin Panel</div>
                    </div>
                    <div className="adm-user-cell">
                        <div className="adm-user-avatar">{adminUser?.initials}</div>
                        <div>
                            <div className="adm-user-name">{adminUser?.fullName}</div>
                            <div className="adm-user-email">{adminUser?.email}</div>
                        </div>
                    </div>
                </div>

                <div className="adm-content">
                    {tab === "overview"   && <OverviewTab users={users} orders={orders} />}
                    {tab === "orders"     && <OrdersTab />}
                    {tab === "users"      && (
                        <UsersTab
                            users={users}
                            currentUserId={adminUser?.id}
                            onDelete={handleDeleteUser}
                            onChangeRole={handleChangeRole}
                            onToggleLock={handleToggleLock}
                        />
                    )}
                    {tab === "tours"      && <CrudTab config={toursConfig} />}
                    {tab === "hotels"     && <CrudTab config={hotelsConfig} />}
                    {tab === "transport"  && <CrudTab config={transportConfig} />}
                    {tab === "restaurant" && <CrudTab config={restaurantConfig} />}
                </div>
            </main>

            {confirmUser && (
                <Confirm
                    message={`Xóa người dùng "${confirmUser.fullName}"? Hành động này không thể hoàn tác.`}
                    onConfirm={confirmDeleteUser}
                    onCancel={() => setConfirmUser(null)}
                />
            )}
        </div>
    );
};

export default AdminPanel;
