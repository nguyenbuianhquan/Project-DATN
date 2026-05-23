import React, { useEffect, useState } from "react";
import tourData from "../../../src/Data/Tours.json";
import { useNavigate } from "react-router-dom";
import FilterSidebar from "./FilterSidebar";

const formatVND = (vnd) => Math.round(vnd).toLocaleString('vi-VN') + ' ₫';

const ratingLabel = (r) => {
    if (r >= 4.8) return 'Xuất sắc';
    if (r >= 4.5) return 'Tuyệt vời';
    if (r >= 4.0) return 'Rất tốt';
    return 'Tốt';
};

const Tours = () => {
    const [tours, setTours] = useState([]);
    const [visibleCount, setVisibleCount] = useState(8);
    const [sortBy, setSortBy] = useState("default");
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem("admin_tours");
        if (!stored) { setTours(tourData); return; }
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && parsed[0].price < 10000) { localStorage.removeItem("admin_tours"); setTours(tourData); return; }
        setTours(parsed);
    }, []);

    const sortedTours = [...tours].sort((a, b) => {
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
                        <FilterSidebar type="tours" />
                    </div>

                    <div className="col-lg-9">
                        <div className="lp-section-header">
                            <div>
                                <h2 className="lp-section-title">Danh sách tour du lịch</h2>
                                <span className="lp-count">{tours.length} tour du lịch</span>
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
                            {sortedTours.slice(0, visibleCount).map((tour) => (
                                <div
                                    className="hotel-list-card"
                                    key={tour.id}
                                    onClick={() => navigate(`/TourDetails/${tour.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="hotel-list-img-wrap">
                                        <img src={tour.image} alt={tour.title} className="hotel-list-img" />
                                        {tour.tag && (
                                            <span className="hotel-list-featured-badge">{tour.tag}</span>
                                        )}
                                        <div className="tour-card-duration-badge">
                                            <i className="ri-time-line me-1"></i>{tour.duration}
                                        </div>
                                    </div>

                                    <div className="hotel-list-body">
                                        <div className="hotel-list-top">
                                            <div className="hotel-list-info">
                                                <div className="hotel-list-name">{tour.title}</div>
                                                <div className="hotel-list-location">
                                                    <i className="ri-map-pin-2-fill"></i>
                                                    <span>{tour.location}</span>
                                                </div>
                                                <div className="hotel-list-facilities">
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-calendar-2-line"></i> {tour.duration}
                                                    </span>
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-user-3-line"></i> {tour.persons}
                                                    </span>
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-compass-3-line"></i> Tour trọn gói
                                                    </span>
                                                    <span className="hotel-fac-pill">
                                                        <i className="ri-shield-check-line"></i> Bảo hiểm du lịch
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="hotel-list-rating-box">
                                                <span className="hotel-rating-label">{ratingLabel(tour.rating)}</span>
                                                <span className="hotel-rating-score">{tour.rating}</span>
                                                <div className="hotel-rating-reviews">{tour.reviews} đánh giá</div>
                                            </div>
                                        </div>

                                        <div className="hotel-list-footer">
                                            <div className="hotel-avail-group">
                                                <span className="hotel-avail-ok">
                                                    <i className="ri-checkbox-circle-fill"></i> Còn chỗ
                                                </span>
                                                <span className="hotel-cancel-free">
                                                    <i className="ri-check-line"></i> Hủy miễn phí 7 ngày
                                                </span>
                                            </div>

                                            <div className="hotel-list-price-block">
                                                <div className="hotel-price-note">Giá từ</div>
                                                <div className="hotel-list-price">{formatVND(tour.price)}</div>
                                                <div className="hotel-list-price-label">/người</div>
                                                <div className="hotel-list-view-hint">
                                                    <i className="ri-eye-line me-1"></i> Xem lịch trình &amp; đặt tour
                                                    <i className="ri-arrow-right-line ms-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {visibleCount < tours.length && (
                            <button onClick={() => setVisibleCount(v => v + 6)} className="lp-load-more">
                                Xem thêm
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tours;
