import React, { useState } from 'react';

const CONFIG = {
    tours: {
        serviceLabel: "Loại tour",
        serviceIcon:  "ri-compass-3-line",
        serviceOpts:  ["Mạo hiểm", "Nghỉ dưỡng", "Văn hóa", "Sinh thái", "Gia đình"],
        dateLabel:    "Ngày khởi hành",
        guestLabel:   "Số khách",
    },
    hotels: {
        serviceLabel: "Hạng lưu trú",
        serviceIcon:  "ri-hotel-line",
        serviceOpts:  ["Resort 5 sao", "Khách sạn", "Hostel", "Boutique", "Villa"],
        dateLabel:    "Ngày nhận phòng",
        guestLabel:   "Số phòng",
    },
    transports: {
        serviceLabel: "Loại phương tiện",
        serviceIcon:  "ri-car-line",
        serviceOpts:  ["Xe hơi", "Xe buýt", "Tàu hỏa", "Máy bay", "Thuyền / Ca nô"],
        dateLabel:    "Ngày di chuyển",
        guestLabel:   "Số hành khách",
    },
    restaurants: {
        serviceLabel: "Loại ẩm thực",
        serviceIcon:  "ri-restaurant-line",
        serviceOpts:  ["Fast Food", "Ẩm thực Ý", "Sushi & Nhật Bản", "Hải sản", "Chay & Thuần chay"],
        dateLabel:    "Ngày đặt bàn",
        guestLabel:   "Số khách",
    },
};

const HOTEL_AMENITIES = [
    { label: 'Wi-Fi miễn phí',   icon: 'ri-wifi-line',          key: 'wi-fi' },
    { label: 'Hồ bơi',           icon: 'ri-water-flash-line',   key: 'hồ bơi' },
    { label: 'Nhà hàng',         icon: 'ri-restaurant-line',    key: 'nhà hàng' },
    { label: 'Spa & Wellness',   icon: 'ri-heart-pulse-line',   key: 'spa' },
    { label: 'Gym / Fitness',    icon: 'ri-run-line',            key: 'gym' },
    { label: 'Đưa đón sân bay',  icon: 'ri-taxi-line',          key: 'đưa đón' },
    { label: 'Bãi đỗ xe',        icon: 'ri-parking-box-line',   key: 'đỗ xe' },
    { label: 'Phòng họp',        icon: 'ri-presentation-line',  key: 'phòng họp' },
];

const FilterSidebar = ({ type = "tours", onFilterChange }) => {
    const cfg = CONFIG[type] || CONFIG.tours;

    // Shared state
    const [minRating, setMinRating]     = useState(0);
    const [dateVal,   setDateVal]       = useState('');
    const [guestVal,  setGuestVal]      = useState('');

    // Hotel-specific state
    const [priceMin,         setPriceMin]         = useState('');
    const [priceMax,         setPriceMax]         = useState('');
    const [amenities,        setAmenities]        = useState([]);
    const [freeCancellation, setFreeCancellation] = useState(false);

    const toggleAmenity = (key) => {
        setAmenities(prev =>
            prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
        );
    };

    const handleApply = () => {
        onFilterChange?.({
            priceMin:         priceMin ? Number(priceMin) * 1000 : null,
            priceMax:         priceMax ? Number(priceMax) * 1000 : null,
            amenities,
            minRating,
            freeCancellation,
        });
    };

    const handleReset = () => {
        setMinRating(0);
        setPriceMin('');
        setPriceMax('');
        setAmenities([]);
        setFreeCancellation(false);
        setDateVal('');
        setGuestVal('');
        onFilterChange?.({});
    };

    return (
        <div className="lp-sidebar">
            <div className="lp-filter-title">
                <i className="ri-equalizer-2-fill"></i> Bộ lọc tìm kiếm
            </div>

            {/* Destination */}
            <div className="lp-filter-section">
                <label className="lp-filter-label">
                    <i className="ri-map-pin-line"></i> Điểm đến
                </label>
                <select className="lp-select">
                    <option value="">Tất cả điểm đến</option>
                    <option>Đà Nẵng</option>
                    <option>Hà Nội</option>
                    <option>TP. Hồ Chí Minh</option>
                    <option>Phú Quốc</option>
                    <option>Hội An</option>
                    <option>Nha Trang</option>
                    <option>Sa Pa</option>
                </select>
            </div>

            {/* Service type */}
            <div className="lp-filter-section">
                <label className="lp-filter-label">
                    <i className={cfg.serviceIcon}></i> {cfg.serviceLabel}
                </label>
                <select className="lp-select">
                    <option value="">Tất cả</option>
                    {cfg.serviceOpts.map(opt => (
                        <option key={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            <div className="lp-filter-divider"></div>

            {/* Date + Guests */}
            <div className="lp-filter-row">
                <div>
                    <label className="lp-filter-label">
                        <i className="ri-calendar-line"></i> {cfg.dateLabel}
                    </label>
                    <input type="date" className="lp-input" value={dateVal} onChange={e => setDateVal(e.target.value)} />
                </div>
                <div>
                    <label className="lp-filter-label">
                        <i className="ri-user-line"></i> {cfg.guestLabel}
                    </label>
                    <input type="number" className="lp-input" placeholder="1" min="1" value={guestVal} onChange={e => setGuestVal(e.target.value)} />
                </div>
            </div>

            <div className="lp-filter-divider"></div>

            {/* Rating */}
            <div className="lp-filter-section">
                <label className="lp-filter-label">
                    <i className="ri-star-line"></i> Đánh giá tối thiểu
                </label>
                <div className="lp-rating-row">
                    {[5, 4, 3, 2, 1].map(star => (
                        <button
                            key={star}
                            className={`lp-rating-btn${minRating === star ? ' active' : ''}`}
                            onClick={() => setMinRating(prev => prev === star ? 0 : star)}
                        >
                            <i className="ri-star-fill"></i> {star}+
                        </button>
                    ))}
                </div>
            </div>

            {/* Hotel-specific filters */}
            {type === 'hotels' && (
                <>
                    <div className="lp-filter-divider"></div>

                    {/* Price range */}
                    <div className="lp-filter-section">
                        <label className="lp-filter-label">
                            <i className="ri-price-tag-3-line"></i> Khoảng giá (nghìn ₫/đêm)
                        </label>
                        <div className="lp-price-range">
                            <input
                                type="number"
                                className="lp-input"
                                placeholder="Từ (vd: 500)"
                                min="0"
                                value={priceMin}
                                onChange={e => setPriceMin(e.target.value)}
                            />
                            <span className="lp-price-sep">—</span>
                            <input
                                type="number"
                                className="lp-input"
                                placeholder="Đến (vd: 5000)"
                                min="0"
                                value={priceMax}
                                onChange={e => setPriceMax(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="lp-filter-divider"></div>

                    {/* Amenities */}
                    <div className="lp-filter-section">
                        <label className="lp-filter-label">
                            <i className="ri-sparkling-line"></i> Tiện nghi
                        </label>
                        <div className="lp-amenity-grid">
                            {HOTEL_AMENITIES.map(({ label, icon, key }) => (
                                <label key={key} className={`lp-amenity-pill${amenities.includes(key) ? ' active' : ''}`}>
                                    <input
                                        type="checkbox"
                                        style={{ display: 'none' }}
                                        checked={amenities.includes(key)}
                                        onChange={() => toggleAmenity(key)}
                                    />
                                    <i className={icon}></i>
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="lp-filter-divider"></div>

                    {/* Extra options */}
                    <div className="lp-filter-section">
                        <label className="lp-filter-label">
                            <i className="ri-shield-check-line"></i> Tuỳ chọn
                        </label>
                        <label className="lp-check">
                            <input
                                type="checkbox"
                                checked={freeCancellation}
                                onChange={e => setFreeCancellation(e.target.checked)}
                            />
                            Còn phòng trống
                        </label>
                        <label className="lp-check">
                            <input type="checkbox" /> Hủy miễn phí
                        </label>
                        <label className="lp-check">
                            <input type="checkbox" /> Bao gồm bữa sáng
                        </label>
                        <label className="lp-check">
                            <input type="checkbox" /> Giảm giá đặc biệt
                        </label>
                    </div>
                </>
            )}

            {type !== 'hotels' && (
                <>
                    <div className="lp-filter-section">
                        <label className="lp-filter-label">
                            <i className="ri-price-tag-3-line"></i> Ưu đãi
                        </label>
                        <label className="lp-check"><input type="checkbox" /> Sắp hết chỗ</label>
                        <label className="lp-check"><input type="checkbox" /> Giảm giá mùa đông</label>
                    </div>
                </>
            )}

            <div className="lp-filter-actions">
                <button className="lp-filter-btn" onClick={handleApply}>
                    <i className="ri-search-2-line"></i> Áp dụng
                </button>
                <button className="lp-filter-reset" onClick={handleReset}>
                    <i className="ri-refresh-line"></i> Đặt lại
                </button>
            </div>
        </div>
    );
};

export default FilterSidebar;
