import React, { useState } from "react";
import transportJson from "../../../src/Data/Transport.json";
import FilterSidebar from "./FilterSidebar";
import { useNavigate } from "react-router-dom";

const formatVND = (vnd) => Math.round(vnd).toLocaleString('vi-VN') + ' ₫';

const ratingLabel = (r) => {
    if (r >= 4.8) return 'Xuất sắc';
    if (r >= 4.5) return 'Tuyệt vời';
    if (r >= 4.0) return 'Rất tốt';
    if (r >= 3.5) return 'Tốt';
    return 'Bình thường';
};

const CITIES = ['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Huế'];

const TransportListPage = () => {
    const navigate = useNavigate();
    const [transportData] = useState(() => {
        const stored = localStorage.getItem("admin_transport");
        if (!stored) return transportJson;
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && parsed[0].price < 10000) { localStorage.removeItem("admin_transport"); return transportJson; }
        return parsed;
    });
    const [sortBy, setSortBy] = useState("default");
    const [fromCity, setFromCity] = useState('');
    const [toCity, setToCity] = useState('');
    const [pickupDate, setPickupDate] = useState('');

    const sortedData = [...transportData].sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
    });

    return (
        <div className="lp-root">
            <div className="container">
                {/* Route Search Bar */}
                <div className="transport-route-search mb-4">
                    <div className="transport-route-title">
                        <i className="ri-roadster-line me-2"></i>
                        Tìm kiếm phương tiện theo hành trình
                    </div>
                    <div className="transport-route-fields">
                        <div className="transport-route-field">
                            <i className="ri-map-pin-line"></i>
                            <select
                                className="transport-city-select"
                                value={fromCity}
                                onChange={e => setFromCity(e.target.value)}
                            >
                                <option value="">Điểm đón / Thành phố xuất phát</option>
                                {CITIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="transport-route-swap" onClick={() => { const t = fromCity; setFromCity(toCity); setToCity(t); }}>
                            <i className="ri-arrow-left-right-line"></i>
                        </div>
                        <div className="transport-route-field">
                            <i className="ri-map-pin-2-line"></i>
                            <select
                                className="transport-city-select"
                                value={toCity}
                                onChange={e => setToCity(e.target.value)}
                            >
                                <option value="">Điểm đến / Thành phố đến</option>
                                {CITIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="transport-route-field" style={{ flex: '0 0 180px' }}>
                            <i className="ri-calendar-line"></i>
                            <input
                                type="date"
                                className="transport-city-select"
                                value={pickupDate}
                                onChange={e => setPickupDate(e.target.value)}
                                style={{ color: pickupDate ? '#fff' : 'rgba(255,255,255,0.4)' }}
                            />
                        </div>
                        <button className="transport-search-btn">
                            <i className="ri-search-line me-1"></i> Tìm xe
                        </button>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-lg-3">
                        <FilterSidebar type="transports" />
                    </div>

                    <div className="col-lg-9">
                        <div className="lp-section-header">
                            <div>
                                <h2 className="lp-section-title">Phương tiện di chuyển</h2>
                                <span className="lp-count">{sortedData.length} phương tiện</span>
                            </div>
                            <select
                                className="form-select form-select-sm bg-dark border-secondary text-white"
                                style={{ width: 'auto', fontSize: '0.82rem' }}
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="default">Phù hợp nhất</option>
                                <option value="price_asc">Giá thấp → cao</option>
                                <option value="price_desc">Giá cao → thấp</option>
                                <option value="rating">Đánh giá cao nhất</option>
                            </select>
                        </div>

                        <div className="d-flex flex-column gap-3">
                            {sortedData.map((vehicle) => (
                                <div
                                    className="hotel-list-card"
                                    key={vehicle.id}
                                    onClick={() => navigate(`/transport/${vehicle.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="hotel-list-img-wrap">
                                        <img src={vehicle.image} alt={vehicle.name} className="hotel-list-img" />
                                        <span className="hotel-list-featured-badge" style={{ background: 'rgba(1,123,110,0.9)' }}>
                                            {vehicle.transmission}
                                        </span>
                                    </div>

                                    <div className="hotel-list-body">
                                        <div className="hotel-list-top">
                                            <div className="hotel-list-info">
                                                <div className="hotel-list-name">{vehicle.name}</div>
                                                <div className="hotel-list-location">
                                                    <i className="ri-map-pin-2-fill"></i>
                                                    <span>{vehicle.location}</span>
                                                </div>
                                                <div className="hotel-list-facilities">
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-roadster-line"></i> {vehicle.mileage}
                                                    </span>
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-user-line"></i> {vehicle.seats} chỗ
                                                    </span>
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-repeat-line"></i> {vehicle.trips} chuyến
                                                    </span>
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-settings-2-line"></i> {vehicle.transmission}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="hotel-list-rating-box">
                                                <span className="hotel-rating-label">{ratingLabel(vehicle.rating)}</span>
                                                <span className="hotel-rating-score">{vehicle.rating}</span>
                                                <div className="hotel-rating-reviews">{vehicle.reviews} đánh giá</div>
                                            </div>
                                        </div>

                                        <div className="hotel-list-footer">
                                            <div className="hotel-avail-group">
                                                <span className="hotel-avail-ok">
                                                    <i className="ri-checkbox-circle-fill"></i> Còn xe
                                                </span>
                                                <span className="hotel-cancel-free">
                                                    <i className="ri-check-line"></i> Hủy miễn phí 24h
                                                </span>
                                            </div>

                                            <div className="hotel-list-price-block">
                                                <div className="hotel-price-note">Giá từ</div>
                                                <div className="hotel-list-price">{formatVND(vehicle.price)}</div>
                                                <div className="hotel-list-price-label">/ngày</div>
                                                <div className="hotel-list-view-hint">
                                                    <i className="ri-eye-line me-1"></i> Xem xe &amp; đặt ngay
                                                    <i className="ri-arrow-right-line ms-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransportListPage;
