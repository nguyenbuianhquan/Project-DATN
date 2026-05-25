import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import restaurantJson from '../../../src/Data/Restaurant.json';
import { useAuth } from '../../Context/AuthContext';

const formatVND = (vnd) => Math.round(vnd).toLocaleString('vi-VN') + ' ₫';

const TABS = [
    { label: 'Tổng quan', icon: 'information'  },
    { label: 'Thực đơn',  icon: 'restaurant-2' },
    { label: 'Vị trí',    icon: 'map-pin-2'    },
    { label: 'Đánh giá',  icon: 'star'         },
    { label: 'Bảng giá',  icon: 'price-tag-3'  },
];

const StarRow = ({ rating }) => (
    <span className="td-star-row">
        {[1, 2, 3, 4, 5].map(s => (
            <i key={s} className={`ri-star-${s <= Math.round(rating) ? 'fill' : 'line'}`}></i>
        ))}
    </span>
);

const menuSections = [
    {
        category: 'Khai vị', icon: 'leaf',
        items: [
            { name: 'Salad tươi theo mùa',  price: 120000 },
            { name: 'Súp kem nấm rừng',     price: 150000 },
            { name: 'Gỏi cuốn thập cẩm',    price: 95000  },
            { name: 'Bánh mì nướng bơ tỏi', price: 65000  },
        ]
    },
    {
        category: 'Món chính', icon: 'restaurant-2',
        items: [
            { name: 'Bít tết Wagyu A5',                 price: 950000 },
            { name: 'Cá hồi áp chảo sốt chanh bơ',     price: 520000 },
            { name: 'Mì Ý carbonara truyền thống',       price: 280000 },
            { name: 'Gà nướng thảo mộc Địa Trung Hải',  price: 350000 },
        ]
    },
    {
        category: 'Tráng miệng', icon: 'cake-2',
        items: [
            { name: 'Bánh tiramisu Ý',            price: 180000 },
            { name: 'Sorbet trái cây nhiệt đới',  price: 120000 },
            { name: 'Crème brûlée Pháp',          price: 165000 },
            { name: 'Bánh fondant chocolate',     price: 195000 },
        ]
    },
    {
        category: 'Đồ uống', icon: 'goblet',
        items: [
            { name: 'Nước ép trái cây tươi',       price: 75000  },
            { name: 'Cocktail đặc trưng nhà hàng', price: 220000 },
            { name: 'Trà thảo mộc hữu cơ',        price: 85000  },
            { name: 'Mocktail nhiệt đới',          price: 130000 },
        ]
    },
];

const sampleRestaurantReviews = [
    { id: 1, name: 'Phạm Thị Lan',  avatar: 'PL', rating: 5, date: '12/02/2025', comment: 'Nhà hàng tuyệt vời! Món bít tết Wagyu ngon xuất sắc, không gian sang trọng. Nhân viên phục vụ chu đáo và chuyên nghiệp.' },
    { id: 2, name: 'Lê Hoàng Nam',  avatar: 'LN', rating: 5, date: '25/03/2025', comment: 'Trải nghiệm ẩm thực đẳng cấp. Đầu bếp rất tài năng, hương vị đậm đà và sáng tạo. Giá cả xứng đáng với chất lượng.' },
    { id: 3, name: 'Vũ Thị Thu',    avatar: 'VT', rating: 4, date: '08/04/2025', comment: 'Nhà hàng đẹp, không khí lãng mạn. Thực đơn đa dạng, đặc biệt thích tiramisu. Sẽ quay lại với bạn bè!' },
];

const diningPackages = [
    { label: 'Set Menu 2 người',  courses: '3 món',             price: 0,     note: 'Khai vị + chính + tráng miệng', discount: 0  },
    { label: 'Business Lunch',    courses: '2 món',             price: -0.15, note: 'Chỉ áp dụng 11h–14h',           discount: 15 },
    { label: 'Romantic Dinner',   courses: '4 món + rượu vang', price: 0.3,   note: 'Đặt trước 24h',                 discount: 0  },
    { label: 'Family Feast (4+)', courses: '5 món chia sẻ',    price: 0.8,   note: 'Ưu đãi 10% cho bàn 4+ người',  discount: 10 },
];

const TIME_SLOTS = ['11:00','12:00','13:00','14:00','18:00','18:30','19:00','19:30','20:00','20:30','21:00'];

const RestaurantDetail = () => {
    const { id }          = useParams();
    const navigate        = useNavigate();
    const { currentUser } = useAuth();

    const allRestaurants = (() => {
        const stored = localStorage.getItem('admin_restaurant');
        if (!stored) return restaurantJson;
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && parsed[0].price < 10000) { localStorage.removeItem('admin_restaurant'); return restaurantJson; }
        return parsed;
    })();
    const restaurant = allRestaurants.find(r => String(r.id) === id);

    const [activeTab,       setActiveTab]       = useState('Tổng quan');
    const [adults,          setAdults]          = useState(2);
    const [children,        setChildren]        = useState(0);
    const [bookDate,        setBookDate]        = useState('');
    const [bookTime,        setBookTime]        = useState('');
    const [showTimeDrop,    setShowTimeDrop]    = useState(false);
    const [showGuestPicker, setShowGuestPicker] = useState(false);
    const [lightboxSrc,     setLightboxSrc]     = useState(null);
    const timeDropRef    = useRef(null);
    const guestPickerRef = useRef(null);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        const handler = (e) => {
            if (timeDropRef.current    && !timeDropRef.current.contains(e.target))    setShowTimeDrop(false);
            if (guestPickerRef.current && !guestPickerRef.current.contains(e.target)) setShowGuestPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!restaurant) {
        return (
            <div className="container py-5 text-center">
                <h4 style={{ color: '#fff' }}>Không tìm thấy nhà hàng.</h4>
                <button className="lp-btn mt-3" onClick={() => navigate('/restaurants')}>Quay lại</button>
            </div>
        );
    }

    const galleryImgs = Array(5).fill(restaurant.image);
    const childPrice  = Math.round(restaurant.price * 0.5);
    const total       = restaurant.price * adults + childPrice * children;
    const totalGuests = adults + children;
    const mapQuery    = encodeURIComponent(restaurant.title + ', ' + restaurant.location);
    const guestLabel  = [
        `${adults} người lớn`,
        children > 0 ? `${children} trẻ em` : null,
    ].filter(Boolean).join(' · ');

    const handleBook = () => {
        if (!currentUser) { navigate('/signin'); return; }
        localStorage.setItem('bookingItem', JSON.stringify({
            id:       restaurant.id,
            title:    restaurant.title,
            image:    restaurant.image,
            price:    Math.round(total * 1.1),
            quantity: totalGuests,
            location: restaurant.location || 'Điểm đến đã chọn',
        }));
        navigate('/checkout');
    };

    return (
        <>
            {/* Lightbox */}
            {lightboxSrc && (
                <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
                    <button className="lightbox-close" onClick={() => setLightboxSrc(null)}>
                        <i className="ri-close-line"></i>
                    </button>
                    <img src={lightboxSrc} alt="Ảnh phóng to" className="lightbox-img" onClick={e => e.stopPropagation()} />
                </div>
            )}

            {/* ── Page Header ── */}
            <div className="td-page-header">
                <div className="container">
                    <nav className="td-breadcrumb">
                        <span className="td-crumb" onClick={() => navigate('/')}>Trang chủ</span>
                        <i className="ri-arrow-right-s-line"></i>
                        <span className="td-crumb" onClick={() => navigate('/restaurants')}>Nhà hàng</span>
                        <i className="ri-arrow-right-s-line"></i>
                        <span className="td-crumb active">{restaurant.title}</span>
                    </nav>

                    {restaurant.tag && <span className="td-page-tag">{restaurant.tag}</span>}
                    <h1 className="td-page-title">{restaurant.title}</h1>

                    <div className="td-meta-row">
                        <span className="td-meta-rating">
                            <i className="ri-star-fill"></i> {restaurant.rating}
                        </span>
                        <span className="td-meta-reviews">({restaurant.reviews} đánh giá)</span>
                        <span className="td-meta-sep">·</span>
                        <span className="td-meta-item">
                            <i className="ri-map-pin-2-fill"></i> {restaurant.location}
                        </span>
                        <span className="td-meta-sep">·</span>
                        <span className="td-meta-item">
                            <i className="ri-time-line"></i> 10:00 – 22:00
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Gallery ── */}
            <div className="td-gallery-section">
                <div className="container">
                    <div className="td-gallery-grid">
                        <div className="td-gallery-main" onClick={() => setLightboxSrc(galleryImgs[0])}>
                            <img src={galleryImgs[0]} alt={restaurant.title} className="td-gallery-img" />
                        </div>
                        <div className="td-gallery-thumbs">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="td-gallery-thumb"
                                    onClick={() => setLightboxSrc(galleryImgs[i] || galleryImgs[0])}>
                                    <img src={galleryImgs[i] || galleryImgs[0]} alt={`Ảnh ${i + 1}`} className="td-gallery-img" />
                                    {i === 4 && (
                                        <div className="td-gallery-more">
                                            <i className="ri-image-2-line"></i>
                                            <span>Xem tất cả ảnh</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="td-body">
                <div className="container">

                    {/* Tabs */}
                    <div className="td-tabs-wrap">
                        <div className="td-tabs">
                            {TABS.map(tab => (
                                <button key={tab.label}
                                    className={`td-tab${activeTab === tab.label ? ' active' : ''}`}
                                    onClick={() => setActiveTab(tab.label)}>
                                    <i className={`ri-${tab.icon}-line`}></i>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="row g-4 mt-2">
                        <div className="col-lg-8">

                            {/* ── Tổng quan ── */}
                            {activeTab === 'Tổng quan' && (
                                <div className="d-flex flex-column gap-4">
                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-file-text-line"></i> Giới thiệu nhà hàng</h5>
                                        <p className="td-para">
                                            Nhà hàng <strong>{restaurant.title}</strong> mang đến trải nghiệm ẩm thực độc đáo tại{' '}
                                            <strong>{restaurant.location}</strong>. Với không gian sang trọng, ấm cúng và thực đơn đa dạng được chế biến từ nguyên liệu tươi ngon nhất.
                                        </p>
                                        <p className="td-para">
                                            Đội ngũ đầu bếp giàu kinh nghiệm kết hợp hài hòa giữa hương vị truyền thống và phong cách ẩm thực hiện đại, tạo nên những món ăn vừa quen thuộc vừa mới lạ.
                                        </p>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-information-line"></i> Thông tin chung</h5>
                                        <div className="td-depart-grid mt-2">
                                            {[
                                                { icon: 'time',         label: 'Giờ mở cửa',  value: '10:00 – 22:00 (Tất cả các ngày)' },
                                                { icon: 'restaurant-2', label: 'Phong cách',  value: restaurant.tag || 'Ẩm thực đặc sắc' },
                                                { icon: 'group',        label: 'Sức chứa',    value: 'Tối đa 200 khách' },
                                                { icon: 'parking-box',  label: 'Bãi đỗ xe',   value: 'Miễn phí 2 giờ' },
                                                { icon: 'phone',        label: 'Đặt bàn',     value: '+84 28 xxxx xxxx' },
                                                { icon: 'map-pin-2',    label: 'Địa chỉ',     value: restaurant.location },
                                            ].map((item, i) => (
                                                <div className="td-depart-card" key={i}>
                                                    <span className="td-depart-icon">
                                                        <i className={`ri-${item.icon}-line`}></i>
                                                    </span>
                                                    <div>
                                                        <div className="td-depart-label">{item.label}</div>
                                                        <div className="td-depart-value">{item.value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-list-check-3"></i> Dịch vụ bao gồm</h5>
                                        <div className="td-include-grid">
                                            <div className="td-include-card td-include-yes">
                                                <div className="td-include-head"><i className="ri-checkbox-circle-fill"></i> Bao gồm</div>
                                                <ul className="td-include-list">
                                                    <li><i className="ri-check-line"></i>Nước uống chào mừng</li>
                                                    <li><i className="ri-check-line"></i>Bánh mì &amp; bơ khai vị</li>
                                                    <li><i className="ri-check-line"></i>Phục vụ tận bàn</li>
                                                    <li><i className="ri-check-line"></i>Wi-Fi miễn phí</li>
                                                </ul>
                                            </div>
                                            <div className="td-include-card td-include-no">
                                                <div className="td-include-head"><i className="ri-close-circle-fill"></i> Không bao gồm</div>
                                                <ul className="td-include-list">
                                                    <li><i className="ri-close-line"></i>Đồ uống có cồn</li>
                                                    <li><i className="ri-close-line"></i>Phụ phí dịch vụ đặc biệt</li>
                                                    <li><i className="ri-close-line"></i>Tiền tip cho nhân viên</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-shield-check-line"></i> Chính sách đặt bàn</h5>
                                        <div className="td-cancel-list">
                                            {[
                                                { color: 'green',  title: 'Hủy trước 2 giờ',             desc: 'Không mất phí đặt cọc' },
                                                { color: 'yellow', title: 'Hủy trong vòng 2 giờ',         desc: 'Thu phí 20%'           },
                                                { color: 'red',    title: 'Không đến mà không báo trước', desc: 'Thu phí 50%'           },
                                            ].map((item, i) => (
                                                <div className={`td-cancel-item ${item.color}`} key={i}>
                                                    <div className={`td-cancel-dot ${item.color}`}></div>
                                                    <div><strong>{item.title}</strong><span> — {item.desc}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* ── Thực đơn ── */}
                            {activeTab === 'Thực đơn' && (
                                <div className="d-flex flex-column gap-3">
                                    <div>
                                        <h5 className="td-section-title" style={{ marginBottom: 4 }}>
                                            <i className="ri-restaurant-2-line" style={{ color: 'var(--secondary-color)' }}></i> Thực đơn nổi bật
                                        </h5>
                                        <p className="td-para mb-3">Danh sách các món được ưa chuộng nhất tại {restaurant.title}</p>
                                    </div>
                                    <div className="row g-3">
                                        {menuSections.map((section, i) => (
                                            <div className="col-md-6" key={i}>
                                                <div className="menu-section-card">
                                                    <div className="menu-section-header">
                                                        <i className={`ri-${section.icon}-line`}></i>
                                                        <span>{section.category}</span>
                                                    </div>
                                                    {section.items.map((item, j) => (
                                                        <div key={j} className="menu-item-row">
                                                            <span className="menu-item-name">{item.name}</span>
                                                            <span className="menu-item-price">{formatVND(item.price)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="price-note-box">
                                        <i className="ri-information-line"></i>
                                        Giá chưa bao gồm VAT 10%. Thực đơn có thể thay đổi theo mùa.
                                    </div>
                                </div>
                            )}

                            {/* ── Vị trí ── */}
                            {activeTab === 'Vị trí' && (
                                <section className="td-section">
                                    <h5 className="td-section-title"><i className="ri-map-2-line"></i> Vị trí nhà hàng</h5>
                                    <div className="td-map-wrap mt-2">
                                        <iframe title="Vị trí nhà hàng"
                                            src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&z=15`}
                                            width="100%" height="320"
                                            style={{ border: 0, borderRadius: 12, display: 'block' }}
                                            allowFullScreen="" loading="lazy" />
                                    </div>
                                    <div className="row g-3 mt-2">
                                        {[
                                            { icon: 'time',        label: 'Giờ mở cửa', value: '10:00 – 22:00' },
                                            { icon: 'parking-box', label: 'Bãi đỗ xe',  value: 'Miễn phí 2 giờ' },
                                            { icon: 'phone',       label: 'Điện thoại', value: '+84 28 xxxx xxxx' },
                                            { icon: 'map-pin-2',   label: 'Khu vực',    value: restaurant.location },
                                        ].map((item, i) => (
                                            <div className="col-6" key={i}>
                                                <div className="detail-location-item">
                                                    <i className={`ri-${item.icon}-line`} style={{ color: '#f26f55', fontSize: '1.2rem' }}></i>
                                                    <div>
                                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>{item.label}</div>
                                                        <div style={{ color: '#fff', fontWeight: 600 }}>{item.value}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="lp-btn lp-btn-outline mt-3 d-inline-flex align-items-center gap-2">
                                        <i className="ri-external-link-line"></i> Mở trong Google Maps
                                    </a>
                                </section>
                            )}

                            {/* ── Đánh giá ── */}
                            {activeTab === 'Đánh giá' && (
                                <div className="d-flex flex-column gap-4">
                                    <div className="td-rating-summary">
                                        <div className="td-rating-score">{restaurant.rating}</div>
                                        <div className="td-rating-detail">
                                            <StarRow rating={restaurant.rating} />
                                            <div className="td-rating-label">
                                                {restaurant.rating >= 4.8 ? 'Xuất sắc' : restaurant.rating >= 4.5 ? 'Tuyệt vời' : 'Rất tốt'}
                                            </div>
                                            <div className="td-rating-count">{restaurant.reviews} đánh giá</div>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        {sampleRestaurantReviews.map(rev => (
                                            <div key={rev.id} className="review-card">
                                                <div className="review-card-header">
                                                    <div className="review-avatar">{rev.avatar}</div>
                                                    <div>
                                                        <div className="review-name">{rev.name}</div>
                                                        <div className="review-date">{rev.date}</div>
                                                    </div>
                                                    <div className="review-rating-badge">{rev.rating}.0</div>
                                                </div>
                                                <StarRow rating={rev.rating} />
                                                <p className="review-comment">{rev.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Bảng giá ── */}
                            {activeTab === 'Bảng giá' && (
                                <section className="td-section">
                                    <h5 className="td-section-title"><i className="ri-price-tag-3-line"></i> Bảng giá set menu</h5>
                                    <div className="price-table-wrap mt-3">
                                        <table className="price-table">
                                            <thead>
                                                <tr>
                                                    <th>Gói dịch vụ</th>
                                                    <th>Số món</th>
                                                    <th>Giá/người (VNĐ)</th>
                                                    <th>Ghi chú</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {diningPackages.map((pkg, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600, color: '#fff' }}>{pkg.label}</td>
                                                        <td>{pkg.courses}</td>
                                                        <td>
                                                            <span className="price-table-vnd">
                                                                {formatVND(restaurant.price * (1 + pkg.price))}
                                                            </span>
                                                            {pkg.discount > 0 && (
                                                                <span className="ms-2" style={{ background: 'rgba(242,111,85,0.12)', color: 'var(--secondary-color)', borderRadius: 4, padding: '2px 6px', fontSize: '0.75rem' }}>
                                                                    -{pkg.discount}%
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{pkg.note}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="price-note-box mt-3">
                                        <i className="ri-information-line"></i>
                                        Giá chưa bao gồm đồ uống và thuế VAT 10%. Đặt bàn trước để có ưu đãi tốt nhất.
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* ══ Booking Widget ══ */}
                        <div className="col-lg-4">
                            <div className="td-bk-sticky">
                                <div className="td-bk-card">
                                    <div className="td-bk-header">
                                        <div>
                                            <div className="td-bk-from">Giá bữa từ</div>
                                            {restaurant.oldPrice > restaurant.price && (
                                                <div style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
                                                    {formatVND(restaurant.oldPrice)}
                                                </div>
                                            )}
                                            <div className="td-bk-price">{formatVND(restaurant.price)}</div>
                                            <div className="td-bk-unit">/bữa · mỗi người</div>
                                        </div>
                                        <div className="td-bk-verified">
                                            <i className="ri-shield-check-fill"></i>
                                            <span>Đã xác thực</span>
                                        </div>
                                    </div>

                                    <div className="td-bk-body">

                                        {/* Số khách – guest picker popup */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-user-3-line"></i> Số khách
                                            </label>
                                            <div className="td-gp-wrap" ref={guestPickerRef}>
                                                <button type="button"
                                                    className={`td-cs-btn${showGuestPicker ? ' open' : ''}`}
                                                    onClick={() => setShowGuestPicker(v => !v)}>
                                                    <i className="ri-group-line"></i>
                                                    <span>{guestLabel}</span>
                                                    <i className={`ri-arrow-${showGuestPicker ? 'up' : 'down'}-s-line td-cs-arrow`}></i>
                                                </button>
                                                {showGuestPicker && (
                                                    <div className="td-gp-panel">
                                                        {/* Người lớn */}
                                                        <div className="td-gp-row">
                                                            <div className="td-gp-info">
                                                                <div className="td-gp-label">Người lớn</div>
                                                                <div className="td-gp-note">Từ 12 tuổi · Giá đầy đủ</div>
                                                            </div>
                                                            <div className="td-gp-ctrl">
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}>
                                                                    <i className="ri-subtract-line"></i>
                                                                </button>
                                                                <span className="td-gp-count">{adults}</span>
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setAdults(Math.min(20, adults + 1))} disabled={adults + children >= 20}>
                                                                    <i className="ri-add-line"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Trẻ em */}
                                                        <div className="td-gp-row">
                                                            <div className="td-gp-info">
                                                                <div className="td-gp-label">Trẻ em</div>
                                                                <div className="td-gp-note">Dưới 12 tuổi · 50% giá</div>
                                                            </div>
                                                            <div className="td-gp-ctrl">
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0}>
                                                                    <i className="ri-subtract-line"></i>
                                                                </button>
                                                                <span className="td-gp-count">{children}</span>
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setChildren(Math.min(10, children + 1))} disabled={adults + children >= 20}>
                                                                    <i className="ri-add-line"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <button type="button" className="td-gp-done"
                                                            onClick={() => setShowGuestPicker(false)}>
                                                            Xong
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ngày đặt bàn */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-calendar-2-line"></i> Ngày đặt bàn
                                            </label>
                                            <input type="date" className="td-bk-input"
                                                value={bookDate} onChange={e => setBookDate(e.target.value)} />
                                        </div>

                                        {/* Giờ dùng bữa – custom dropdown */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-time-line"></i> Giờ dùng bữa
                                            </label>
                                            <div className="td-cs-wrap" ref={timeDropRef}>
                                                <button type="button"
                                                    className={`td-cs-btn${showTimeDrop ? ' open' : ''}`}
                                                    onClick={() => setShowTimeDrop(v => !v)}>
                                                    <i className="ri-time-line"></i>
                                                    <span>{bookTime || 'Chọn khung giờ...'}</span>
                                                    <i className="ri-arrow-down-s-line td-cs-arrow"></i>
                                                </button>
                                                {showTimeDrop && (
                                                    <div className="td-cs-options">
                                                        {TIME_SLOTS.map(t => (
                                                            <button key={t} type="button"
                                                                className={`td-cs-option${bookTime === t ? ' selected' : ''}`}
                                                                onClick={() => { setBookTime(t); setShowTimeDrop(false); }}>
                                                                <i className="ri-time-line"></i>
                                                                <span>{t}</span>
                                                                {bookTime === t && <i className="ri-check-line td-cs-check"></i>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tóm tắt đặt bàn */}
                                        {(bookDate && bookTime) && (
                                            <div className="td-booking-summary">
                                                <i className="ri-calendar-check-line"></i>
                                                <span>{guestLabel} · {bookDate} · {bookTime}</span>
                                            </div>
                                        )}

                                        <div className="td-breakdown">
                                            <div className="td-breakdown-row">
                                                <span>{formatVND(restaurant.price)} × {adults} người lớn</span>
                                                <span>{formatVND(restaurant.price * adults)}</span>
                                            </div>
                                            {children > 0 && (
                                                <div className="td-breakdown-row">
                                                    <span>{formatVND(childPrice)} × {children} trẻ em</span>
                                                    <span>{formatVND(childPrice * children)}</span>
                                                </div>
                                            )}
                                            <div className="td-breakdown-row">
                                                <span>Thuế VAT (10%)</span>
                                                <span>{formatVND(Math.round(total * 0.1))}</span>
                                            </div>
                                            <div className="td-breakdown-total">
                                                <span>Tổng cộng</span>
                                                <span className="td-breakdown-total-val">
                                                    {formatVND(Math.round(total * 1.1))}
                                                </span>
                                            </div>
                                        </div>

                                        <button type="button"
                                            className="td-book-btn"
                                            onClick={handleBook}>
                                            <i className="ri-calendar-check-line"></i> Đặt bàn ngay
                                        </button>

                                        <div className="td-bk-guarantees">
                                            <div className="td-bk-guarantee-item">
                                                <i className="ri-check-double-line"></i>
                                                <span>Hủy miễn phí trước 2 giờ đặt bàn</span>
                                            </div>
                                            <div className="td-bk-guarantee-item">
                                                <i className="ri-lock-line"></i>
                                                <span>Thanh toán an toàn, bảo mật</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RestaurantDetail;
