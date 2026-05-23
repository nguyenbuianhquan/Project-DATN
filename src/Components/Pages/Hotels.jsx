import React, { useState } from "react";
import hotelJson from "../../../src/Data/Hotel.json";
import FilterSidebar from "./FilterSidebar";
import { useNavigate, useSearchParams } from "react-router-dom";

const formatVND = (vnd) => Math.round(vnd).toLocaleString('vi-VN') + ' ₫';

const ratingLabel = (r) => {
    if (r >= 4.8) return 'Xuất sắc';
    if (r >= 4.5) return 'Tuyệt vời';
    if (r >= 4.0) return 'Rất tốt';
    return 'Tốt';
};

const typeIcon = (type) => {
    if (type === 'Resort') return 'ri-sun-line';
    if (type === 'Căn hộ') return 'ri-building-line';
    if (type === 'Biệt thự') return 'ri-home-heart-line';
    return 'ri-hotel-line';
};

const formatDateVN = (str) => {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
};

const HotelListPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Read search params from Index.jsx search bar
    const paramDest     = searchParams.get('dest')     || '';
    const paramFrom     = searchParams.get('from')     || '';
    const paramTo       = searchParams.get('to')       || '';
    const paramAdults   = parseInt(searchParams.get('adults')   || '2');
    const paramChildren = parseInt(searchParams.get('children') || '0');
    const paramRooms    = parseInt(searchParams.get('rooms')    || '1');

    const [hotelData] = useState(() => {
        const stored = localStorage.getItem("admin_hotels");
        if (!stored) return hotelJson;
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && parsed[0].price < 10000) { localStorage.removeItem("admin_hotels"); return hotelJson; }
        return parsed;
    });

    const [sortBy,      setSortBy]      = useState("default");
    const [filterType,  setFilterType]  = useState("all");
    const [filters,     setFilters]     = useState({});

    // Combined filter + sort
    const processed = [...hotelData]
        .filter(h => {
            if (filterType !== 'all' && h.type !== filterType) return false;
            if (filters.priceMin && h.price < filters.priceMin) return false;
            if (filters.priceMax && h.price > filters.priceMax) return false;
            if (filters.minRating && h.rating < filters.minRating) return false;
            if (filters.amenities && filters.amenities.length > 0) {
                const facNames = (h.facilities || []).map(f => f.name.toLowerCase());
                if (!filters.amenities.every(a => facNames.some(f => f.includes(a.toLowerCase())))) return false;
            }
            if (filters.freeCancellation && !h.rooms?.some(r => r.available)) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "price_asc")  return a.price - b.price;
            if (sortBy === "price_desc") return b.price - a.price;
            if (sortBy === "rating")     return b.rating - a.rating;
            return 0;
        });

    const hasSearch = paramDest || paramFrom || paramTo;
    const guestSummary = `${paramAdults} người lớn${paramChildren > 0 ? `, ${paramChildren} trẻ em` : ''} · ${paramRooms} phòng`;

    return (
        <div className="lp-root">
            <div className="container">

                {/* ── Search Summary Bar ── */}
                {hasSearch && (
                    <div className="hotel-search-bar">
                        <div className="hotel-search-bar-info">
                            {paramDest && (
                                <span className="hsb-item">
                                    <i className="ri-map-pin-2-fill"></i>
                                    {paramDest}
                                </span>
                            )}
                            {(paramFrom || paramTo) && (
                                <span className="hsb-item">
                                    <i className="ri-calendar-line"></i>
                                    {formatDateVN(paramFrom)}{paramTo ? ` → ${formatDateVN(paramTo)}` : ''}
                                </span>
                            )}
                            <span className="hsb-item">
                                <i className="ri-user-line"></i>
                                {guestSummary}
                            </span>
                        </div>
                        <button
                            className="hsb-edit-btn"
                            onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                            <i className="ri-edit-line me-1"></i>Sửa tìm kiếm
                        </button>
                    </div>
                )}

                <div className="row g-4">
                    <div className="col-lg-3">
                        <FilterSidebar type="hotels" onFilterChange={setFilters} />
                    </div>

                    <div className="col-lg-9">
                        <div className="lp-section-header">
                            <div>
                                <h2 className="lp-section-title">
                                    {paramDest ? `Chỗ nghỉ tại ${paramDest}` : 'Chỗ nghỉ tại Việt Nam'}
                                </h2>
                                <span className="lp-count">{processed.length} cơ sở lưu trú</span>
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

                        {/* Type filter tabs */}
                        <div className="hotel-type-tabs mb-4">
                            {['all', 'Khách sạn', 'Resort', 'Căn hộ', 'Biệt thự'].map(t => (
                                <button
                                    key={t}
                                    className={`hotel-type-tab${filterType === t ? ' active' : ''}`}
                                    onClick={() => setFilterType(t)}
                                >
                                    {t === 'all' ? 'Tất cả' : t}
                                </button>
                            ))}
                        </div>

                        {processed.length === 0 ? (
                            <div className="hotel-empty-state">
                                <i className="ri-hotel-line"></i>
                                <p>Không tìm thấy chỗ nghỉ phù hợp với bộ lọc hiện tại.</p>
                                <button className="lp-btn" onClick={() => setFilters({})}>Xoá bộ lọc</button>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {processed.map((hotel) => {
                                    const hasAvailable = hotel.rooms && hotel.rooms.some(r => r.available);
                                    return (
                                        <div
                                            className="hotel-list-card"
                                            key={hotel.id}
                                            onClick={() => navigate(`/hotels/${hotel.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="hotel-list-img-wrap">
                                                <img src={hotel.image} alt={hotel.name} className="hotel-list-img" />
                                                {hotel.type && (
                                                    <span className="hotel-list-featured-badge" style={{ background: 'rgba(99,102,241,0.9)' }}>
                                                        <i className={`${typeIcon(hotel.type)} me-1`}></i>{hotel.type}
                                                    </span>
                                                )}
                                                {hotel.featured && (
                                                    <span className="hotel-list-featured-badge" style={{ background: 'rgba(242,111,85,0.9)', top: 44 }}>Nổi bật</span>
                                                )}
                                            </div>

                                            <div className="hotel-list-body">
                                                <div className="hotel-list-top">
                                                    <div className="hotel-list-info">
                                                        <div className="hotel-list-name">{hotel.name}</div>
                                                        <div className="hotel-list-location">
                                                            <i className="ri-map-pin-2-fill"></i>
                                                            <span>{hotel.location}</span>
                                                        </div>
                                                        <div className="hotel-list-facilities">
                                                            {hotel.facilities.slice(0, 4).map((fac, idx) => (
                                                                <span className="hotel-fac-pill" key={idx}>
                                                                    <i className={`ri-${fac.icon}-line`}></i> {fac.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="hotel-list-rating-box">
                                                        <span className="hotel-rating-label">{ratingLabel(hotel.rating)}</span>
                                                        <span className="hotel-rating-score">{hotel.rating}</span>
                                                        <div className="hotel-rating-reviews">{hotel.reviews} đánh giá</div>
                                                    </div>
                                                </div>

                                                <div className="hotel-list-footer">
                                                    <div className="hotel-avail-group">
                                                        {hasAvailable ? (
                                                            <span className="hotel-avail-ok">
                                                                <i className="ri-checkbox-circle-fill"></i> Còn phòng trống
                                                            </span>
                                                        ) : (
                                                            <span className="hotel-avail-no">
                                                                <i className="ri-close-circle-fill"></i> Hết phòng
                                                            </span>
                                                        )}
                                                        <span className="hotel-cancel-free">
                                                            <i className="ri-check-line"></i> Hủy miễn phí
                                                        </span>
                                                    </div>

                                                    <div className="hotel-list-price-block">
                                                        <div className="hotel-price-note">Giá từ</div>
                                                        <div className="hotel-list-price">{formatVND(hotel.price)}</div>
                                                        <div className="hotel-list-price-label">/đêm · chưa gồm thuế</div>
                                                        <div className="hotel-list-view-hint">
                                                            <i className="ri-eye-line me-1"></i> Xem chi tiết &amp; đặt phòng
                                                            <i className="ri-arrow-right-line ms-1"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelListPage;
