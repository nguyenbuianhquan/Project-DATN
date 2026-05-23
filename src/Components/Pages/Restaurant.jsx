import React, { useState } from "react";
import restaurantJson from "../../../src/Data/Restaurant.json";
import FilterSidebar from "./FilterSidebar";
import { useNavigate } from "react-router-dom";

const formatVND = (vnd) => Math.round(vnd).toLocaleString('vi-VN') + ' ₫';

const ratingLabel = (r) => {
    if (r >= 4.8) return 'Xuất sắc';
    if (r >= 4.5) return 'Tuyệt vời';
    if (r >= 4.0) return 'Rất tốt';
    return 'Tốt';
};

const Restaurants = () => {
    const navigate = useNavigate();
    const [restaurantData] = useState(() => {
        const stored = localStorage.getItem("admin_restaurant");
        if (!stored) return restaurantJson;
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && parsed[0].price < 10000) { localStorage.removeItem("admin_restaurant"); return restaurantJson; }
        return parsed;
    });
    const [sortBy, setSortBy] = useState("default");

    const sortedData = [...restaurantData].sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
    });

    return (
        <div className="lp-root">
            <div className="container">
                <div className="row g-4">
                    <div className="col-lg-3">
                        <FilterSidebar type="restaurants" />
                    </div>

                    <div className="col-lg-9">
                        <div className="lp-section-header">
                            <div>
                                <h2 className="lp-section-title">Nhà hàng &amp; Ẩm thực</h2>
                                <span className="lp-count">{sortedData.length} nhà hàng</span>
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
                            {sortedData.map((item) => (
                                <div
                                    className="hotel-list-card"
                                    key={item.id}
                                    onClick={() => navigate(`/restaurants/${item.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="hotel-list-img-wrap">
                                        <img src={item.image} alt={item.title} className="hotel-list-img" />
                                        {item.tag && (
                                            <span className="hotel-list-featured-badge" style={{ background: 'rgba(242,111,85,0.9)' }}>{item.tag}</span>
                                        )}
                                    </div>

                                    <div className="hotel-list-body">
                                        <div className="hotel-list-top">
                                            <div className="hotel-list-info">
                                                <div className="hotel-list-name">{item.title}</div>
                                                <div className="hotel-list-location">
                                                    <i className="ri-map-pin-2-fill"></i>
                                                    <span>{item.location}</span>
                                                </div>
                                                <div className="hotel-list-facilities">
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-restaurant-2-line"></i> Ẩm thực đặc sắc
                                                    </span>
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-time-line"></i> Đặt bàn online
                                                    </span>
                                                    {item.oldPrice > item.price && (
                                                        <span className="hotel-fac-pill" style={{ color: '#4ade80' }}>
                                                            <i className="ri-percent-line"></i> Tiết kiệm {formatVND(item.oldPrice - item.price)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="hotel-list-rating-box">
                                                <span className="hotel-rating-label">{ratingLabel(item.rating)}</span>
                                                <span className="hotel-rating-score">{item.rating}</span>
                                                <div className="hotel-rating-reviews">{item.reviews} đánh giá</div>
                                            </div>
                                        </div>

                                        <div className="hotel-list-footer">
                                            <div className="hotel-avail-group">
                                                <span className="hotel-avail-ok">
                                                    <i className="ri-checkbox-circle-fill"></i> Còn bàn trống
                                                </span>
                                                <span className="hotel-cancel-free">
                                                    <i className="ri-check-line"></i> Hủy miễn phí 2h
                                                </span>
                                            </div>

                                            <div className="hotel-list-price-block">
                                                {item.oldPrice > item.price && (
                                                    <div style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
                                                        {formatVND(item.oldPrice)}
                                                    </div>
                                                )}
                                                <div className="hotel-price-note">Giá từ</div>
                                                <div className="hotel-list-price" style={{ color: '#4ade80' }}>{formatVND(item.price)}</div>
                                                <div className="hotel-list-price-label">/bữa/người</div>
                                                <div className="hotel-list-view-hint">
                                                    <i className="ri-eye-line me-1"></i> Xem thực đơn &amp; đặt bàn
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

export default Restaurants;
