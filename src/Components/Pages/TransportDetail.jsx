import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import transportJson from '../../../src/Data/Transport.json';
import { useAuth } from '../../Context/AuthContext';

const formatVND = (vnd) => Math.round(vnd).toLocaleString('vi-VN') + ' ₫';

const TABS = [
    { label: 'Tổng quan', icon: 'information'  },
    { label: 'Thông số',  icon: 'settings-2'   },
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

const sampleTransportReviews = [
    { id: 1, name: 'Nguyễn Thành Đạt', avatar: 'ND', rating: 5, date: '08/02/2025', comment: 'Xe sạch sẽ, tài xế chuyên nghiệp và đúng giờ. Chuyến đi thoải mái, điều hòa mát. Rất hài lòng!' },
    { id: 2, name: 'Trần Minh Tâm',    avatar: 'TT', rating: 4, date: '19/03/2025', comment: 'Dịch vụ tốt, xe đời mới. Tài xế thân thiện, hỗ trợ hành lý chu đáo. Giá hợp lý.' },
    { id: 3, name: 'Lê Thị Hoa',       avatar: 'LH', rating: 5, date: '02/04/2025', comment: 'Đặt xe dễ dàng, đúng giờ. Xe rộng rãi, thoải mái cho cả gia đình. Sẽ sử dụng lại!' },
];

const rentalPlans = [
    { label: 'Thuê trong ngày', hours: '8 giờ',   price: 1,   note: 'Tối đa 80 km' },
    { label: 'Thuê 1 ngày',     hours: '24 giờ',  price: 1,   note: 'Tối đa 200 km' },
    { label: 'Thuê 3 ngày',     hours: '72 giờ',  price: 2.8, note: 'Tối đa 600 km' },
    { label: 'Thuê 1 tuần',     hours: '168 giờ', price: 6,   note: 'Km không giới hạn' },
];

const CITIES      = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Huế', 'Cần Thơ', 'Vũng Tàu'];
const PICKUP_TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '14:00', '16:00', '18:00'];
const DAY_OPTIONS  = [1, 2, 3, 5, 7];

const TransportDetail = () => {
    const { id }          = useParams();
    const navigate        = useNavigate();
    const { currentUser } = useAuth();

    const allTransports = (() => {
        const stored = localStorage.getItem('admin_transport');
        if (!stored) return transportJson;
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && parsed[0].price < 10000) { localStorage.removeItem('admin_transport'); return transportJson; }
        return parsed;
    })();
    const vehicle = allTransports.find(v => String(v.id) === id);

    const [activeTab,       setActiveTab]       = useState('Tổng quan');
    const [days,            setDays]            = useState(1);
    const [adults,          setAdults]          = useState(1);
    const [children,        setChildren]        = useState(0);
    const [pickupDate,      setPickupDate]      = useState('');
    const [pickupTime,      setPickupTime]      = useState('08:00');
    const [fromCity,        setFromCity]        = useState('');
    const [toCity,          setToCity]          = useState('');
    const [showTimeDrop,    setShowTimeDrop]    = useState(false);
    const [showFromDrop,    setShowFromDrop]    = useState(false);
    const [showToDrop,      setShowToDrop]      = useState(false);
    const [showGuestPicker, setShowGuestPicker] = useState(false);
    const [lightboxSrc,     setLightboxSrc]     = useState(null);

    const timeRef        = useRef(null);
    const fromRef        = useRef(null);
    const toRef          = useRef(null);
    const guestPickerRef = useRef(null);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    // Đóng tất cả dropdown khi click ra ngoài
    useEffect(() => {
        const handler = (e) => {
            if (timeRef.current        && !timeRef.current.contains(e.target))        setShowTimeDrop(false);
            if (fromRef.current        && !fromRef.current.contains(e.target))        setShowFromDrop(false);
            if (toRef.current          && !toRef.current.contains(e.target))          setShowToDrop(false);
            if (guestPickerRef.current && !guestPickerRef.current.contains(e.target)) setShowGuestPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!vehicle) {
        return (
            <div className="container py-5 text-center">
                <h4 style={{ color: '#fff' }}>Không tìm thấy phương tiện.</h4>
                <button className="lp-btn mt-3" onClick={() => navigate('/transport')}>Quay lại</button>
            </div>
        );
    }

    const galleryImgs     = Array(5).fill(vehicle.image);
    const total           = vehicle.price * days;
    const mapQuery        = encodeURIComponent(vehicle.location);
    const dayIdx          = DAY_OPTIONS.indexOf(days);
    const maxPassengers   = vehicle.seats || 4;
    const totalPassengers = adults + children;
    const guestLabel      = [
        `${adults} người lớn`,
        children > 0 ? `${children} trẻ em` : null,
    ].filter(Boolean).join(' · ');

    const handleBook = () => {
        if (!currentUser) { navigate('/signin'); return; }
        localStorage.setItem('bookingItem', JSON.stringify({
            id:       vehicle.id,
            title:    vehicle.name,
            image:    vehicle.image,
            price:    Math.round(total * 1.1),
            quantity: 1,
            location: vehicle.location || 'Điểm đón',
        }));
        navigate('/booking-info');
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
                        <span className="td-crumb" onClick={() => navigate('/transport')}>Phương tiện</span>
                        <i className="ri-arrow-right-s-line"></i>
                        <span className="td-crumb active">{vehicle.name}</span>
                    </nav>

                    <h1 className="td-page-title">{vehicle.name}</h1>

                    <div className="td-meta-row">
                        <span className="td-meta-rating">
                            <i className="ri-star-fill"></i> {vehicle.rating}
                        </span>
                        <span className="td-meta-reviews">({vehicle.reviews} đánh giá)</span>
                        <span className="td-meta-sep">·</span>
                        <span className="td-meta-item">
                            <i className="ri-repeat-line"></i> {vehicle.trips} chuyến
                        </span>
                        <span className="td-meta-sep">·</span>
                        <span className="td-meta-item">
                            <i className="ri-map-pin-2-fill"></i> {vehicle.location}
                        </span>
                        <span className="td-meta-sep">·</span>
                        <span className="td-meta-item">
                            <i className="ri-user-3-line"></i> {vehicle.seats} chỗ
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Gallery ── */}
            <div className="td-gallery-section">
                <div className="container">
                    <div className="td-gallery-grid">
                        <div className="td-gallery-main" onClick={() => setLightboxSrc(galleryImgs[0])}>
                            <img src={galleryImgs[0]} alt={vehicle.name} className="td-gallery-img" />
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
                                        <h5 className="td-section-title"><i className="ri-file-text-line"></i> Mô tả phương tiện</h5>
                                        <p className="td-para">
                                            Xe <strong>{vehicle.name}</strong> là lựa chọn lý tưởng cho hành trình của bạn. Với hộp số{' '}
                                            <strong>{vehicle.transmission?.toLowerCase()}</strong>, ghế ngồi thoải mái cho{' '}
                                            <strong>{vehicle.seats} người</strong>, chiếc xe đã hoàn thành hơn{' '}
                                            <strong>{vehicle.trips} chuyến</strong> với sự hài lòng từ khách hàng.
                                        </p>
                                        <p className="td-para">
                                            Phù hợp cho các hành trình nội thành, liên tỉnh hoặc thuê xe theo ngày. Tài xế kinh nghiệm, xe đời mới, điều hòa mát, đảm bảo an toàn và thoải mái tối đa trong suốt hành trình.
                                        </p>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-route-line"></i> Hành trình phổ biến</h5>
                                        <div className="row g-2 mt-1">
                                            {[
                                                { from: 'TP. Hồ Chí Minh', to: 'Vũng Tàu', km: '125 km', time: '2h' },
                                                { from: 'Hà Nội',          to: 'Hạ Long',  km: '165 km', time: '2.5h' },
                                                { from: 'Đà Nẵng',         to: 'Hội An',   km: '30 km',  time: '45 phút' },
                                                { from: 'TP. Hồ Chí Minh', to: 'Mũi Né',  km: '200 km', time: '3.5h' },
                                            ].map((route, i) => (
                                                <div className="col-6" key={i}>
                                                    <div className="transport-route-card">
                                                        <div className="transport-route-card-from">
                                                            <i className="ri-map-pin-line" style={{ color: '#f26f55' }}></i>
                                                            <span>{route.from}</span>
                                                        </div>
                                                        <i className="ri-arrow-right-line transport-route-card-arrow"></i>
                                                        <div className="transport-route-card-to">
                                                            <i className="ri-map-pin-2-fill" style={{ color: '#4ade80' }}></i>
                                                            <span>{route.to}</span>
                                                        </div>
                                                        <div className="transport-route-card-meta">
                                                            <span><i className="ri-road-map-line me-1"></i>{route.km}</span>
                                                            <span><i className="ri-time-line me-1"></i>{route.time}</span>
                                                        </div>
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
                                                    <li><i className="ri-check-line"></i>Nhiên liệu trong hành trình</li>
                                                    <li><i className="ri-check-line"></i>Bảo hiểm toàn diện</li>
                                                    <li><i className="ri-check-line"></i>Tài xế chuyên nghiệp</li>
                                                    <li><i className="ri-check-line"></i>GPS &amp; Wi-Fi trên xe</li>
                                                </ul>
                                            </div>
                                            <div className="td-include-card td-include-no">
                                                <div className="td-include-head"><i className="ri-close-circle-fill"></i> Không bao gồm</div>
                                                <ul className="td-include-list">
                                                    <li><i className="ri-close-line"></i>Phí cầu đường, bến bãi</li>
                                                    <li><i className="ri-close-line"></i>Chi phí ăn uống tài xế</li>
                                                    <li><i className="ri-close-line"></i>Phụ phí ngoài giờ</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-shield-check-line"></i> Chính sách thuê xe</h5>
                                        <div className="td-cancel-list">
                                            {[
                                                { color: 'green',  title: 'Hủy trước 24 giờ',     desc: 'Hoàn tiền 100%' },
                                                { color: 'yellow', title: 'Hủy trong 12–24 giờ',   desc: 'Hoàn tiền 50%'  },
                                                { color: 'red',    title: 'Hủy trong vòng 12 giờ', desc: 'Không hoàn tiền' },
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

                            {/* ── Thông số ── */}
                            {activeTab === 'Thông số' && (
                                <div className="d-flex flex-column gap-4">
                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-settings-2-line"></i> Thông số kỹ thuật</h5>
                                        <div className="td-depart-grid mt-2">
                                            {[
                                                { icon: 'roadster',    label: 'Số km đã đi',       value: vehicle.mileage },
                                                { icon: 'settings-2',  label: 'Hộp số',            value: vehicle.transmission },
                                                { icon: 'user-3',      label: 'Số chỗ ngồi',       value: `${vehicle.seats} chỗ` },
                                                { icon: 'repeat',      label: 'Chuyến đã đón',     value: `${vehicle.trips} chuyến` },
                                                { icon: 'map-pin-2',   label: 'Khu vực hoạt động', value: vehicle.location },
                                                { icon: 'star',        label: 'Đánh giá',          value: `${vehicle.rating}/5` },
                                            ].map((spec, i) => (
                                                <div className="td-depart-card" key={i}>
                                                    <span className="td-depart-icon">
                                                        <i className={`ri-${spec.icon}-line`}></i>
                                                    </span>
                                                    <div>
                                                        <div className="td-depart-label">{spec.label}</div>
                                                        <div className="td-depart-value">{spec.value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-check-double-line"></i> Tiện ích trên xe</h5>
                                        <div className="row g-2 mt-1">
                                            {['Điều hòa không khí', 'GPS định vị', 'Wi-Fi miễn phí', 'Âm thanh Bluetooth', 'Camera 360°', 'Ghế da cao cấp'].map((item, i) => (
                                                <div className="col-6 col-md-4" key={i}>
                                                    <div className="detail-facility-item">
                                                        <i className="ri-check-double-line" style={{ color: '#4ade80' }}></i>
                                                        <span>{item}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* ── Vị trí ── */}
                            {activeTab === 'Vị trí' && (
                                <section className="td-section">
                                    <h5 className="td-section-title"><i className="ri-map-2-line"></i> Khu vực hoạt động</h5>
                                    <div className="td-map-wrap mt-2">
                                        <iframe title="Khu vực hoạt động"
                                            src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&z=13`}
                                            width="100%" height="320"
                                            style={{ border: 0, borderRadius: 12, display: 'block' }}
                                            allowFullScreen="" loading="lazy" />
                                    </div>
                                    <div className="row g-3 mt-2">
                                        {[
                                            { icon: 'map-pin-2', label: 'Khu vực chính',   value: vehicle.location },
                                            { icon: 'car',       label: 'Phạm vi phục vụ', value: 'Nội thành & liên tỉnh' },
                                            { icon: 'time',      label: 'Giờ hoạt động',   value: '06:00 – 22:00' },
                                            { icon: 'phone',     label: 'Hotline đặt xe',  value: '1900 xxxx xxxx' },
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
                                        <div className="td-rating-score">{vehicle.rating}</div>
                                        <div className="td-rating-detail">
                                            <StarRow rating={vehicle.rating} />
                                            <div className="td-rating-label">
                                                {vehicle.rating >= 4.5 ? 'Tuyệt vời' : vehicle.rating >= 4.0 ? 'Rất tốt' : 'Tốt'}
                                            </div>
                                            <div className="td-rating-count">{vehicle.reviews} đánh giá</div>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        {sampleTransportReviews.map(rev => (
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
                                    <h5 className="td-section-title"><i className="ri-price-tag-3-line"></i> Bảng giá thuê xe</h5>
                                    <div className="price-table-wrap mt-3">
                                        <table className="price-table">
                                            <thead>
                                                <tr>
                                                    <th>Gói thuê</th>
                                                    <th>Thời gian</th>
                                                    <th>Giá (VNĐ)</th>
                                                    <th>Ghi chú</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rentalPlans.map((plan, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600, color: '#fff' }}>{plan.label}</td>
                                                        <td>{plan.hours}</td>
                                                        <td><span className="price-table-vnd">{formatVND(vehicle.price * plan.price)}</span></td>
                                                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{plan.note}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="price-note-box mt-3">
                                        <i className="ri-information-line"></i>
                                        Giá đã bao gồm: nhiên liệu, tài xế, bảo hiểm và GPS. Phí cầu đường tính thêm.
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
                                            <div className="td-bk-from">Giá từ</div>
                                            <div className="td-bk-price">{formatVND(vehicle.price)}</div>
                                            <div className="td-bk-unit">/ngày</div>
                                        </div>
                                        <div className="td-bk-verified">
                                            <i className="ri-shield-check-fill"></i>
                                            <span>Đã xác thực</span>
                                        </div>
                                    </div>

                                    <div className="td-bk-body">

                                        {/* Điểm đón – custom dropdown */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-map-pin-line" style={{ color: '#f26f55' }}></i> Điểm đón
                                            </label>
                                            <div className="td-cs-wrap" ref={fromRef}>
                                                <button type="button"
                                                    className={`td-cs-btn${showFromDrop ? ' open' : ''}`}
                                                    onClick={() => { setShowFromDrop(v => !v); setShowToDrop(false); setShowTimeDrop(false); }}>
                                                    <i className="ri-map-pin-line" style={{ color: '#f26f55' }}></i>
                                                    <span>{fromCity || 'Chọn thành phố...'}</span>
                                                    <i className="ri-arrow-down-s-line td-cs-arrow"></i>
                                                </button>
                                                {showFromDrop && (
                                                    <div className="td-cs-options">
                                                        {CITIES.map(c => (
                                                            <button key={c} type="button"
                                                                className={`td-cs-option${fromCity === c ? ' selected' : ''}`}
                                                                onClick={() => { setFromCity(c); setShowFromDrop(false); }}>
                                                                <i className="ri-map-pin-line"></i>
                                                                <span>{c}</span>
                                                                {fromCity === c && <i className="ri-check-line td-cs-check"></i>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mũi tên chuyển chiều */}
                                        <div className="td-route-arrow">
                                            <i className="ri-arrow-down-line"></i>
                                        </div>

                                        {/* Điểm đến – custom dropdown */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-map-pin-2-fill" style={{ color: '#4ade80' }}></i> Điểm đến
                                            </label>
                                            <div className="td-cs-wrap" ref={toRef}>
                                                <button type="button"
                                                    className={`td-cs-btn${showToDrop ? ' open' : ''}`}
                                                    onClick={() => { setShowToDrop(v => !v); setShowFromDrop(false); setShowTimeDrop(false); }}>
                                                    <i className="ri-map-pin-2-fill" style={{ color: '#4ade80' }}></i>
                                                    <span>{toCity || 'Chọn thành phố...'}</span>
                                                    <i className="ri-arrow-down-s-line td-cs-arrow"></i>
                                                </button>
                                                {showToDrop && (
                                                    <div className="td-cs-options">
                                                        {CITIES.map(c => (
                                                            <button key={c} type="button"
                                                                className={`td-cs-option${toCity === c ? ' selected' : ''}`}
                                                                onClick={() => { setToCity(c); setShowToDrop(false); }}>
                                                                <i className="ri-map-pin-2-fill"></i>
                                                                <span>{c}</span>
                                                                {toCity === c && <i className="ri-check-line td-cs-check"></i>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ngày đón */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-calendar-2-line"></i> Ngày đón
                                            </label>
                                            <input type="date" className="td-bk-input"
                                                value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                                        </div>

                                        {/* Giờ đón – custom dropdown */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-time-line"></i> Giờ đón
                                            </label>
                                            <div className="td-cs-wrap" ref={timeRef}>
                                                <button type="button"
                                                    className={`td-cs-btn${showTimeDrop ? ' open' : ''}`}
                                                    onClick={() => { setShowTimeDrop(v => !v); setShowFromDrop(false); setShowToDrop(false); }}>
                                                    <i className="ri-time-line"></i>
                                                    <span>{pickupTime}</span>
                                                    <i className="ri-arrow-down-s-line td-cs-arrow"></i>
                                                </button>
                                                {showTimeDrop && (
                                                    <div className="td-cs-options">
                                                        {PICKUP_TIMES.map(t => (
                                                            <button key={t} type="button"
                                                                className={`td-cs-option${pickupTime === t ? ' selected' : ''}`}
                                                                onClick={() => { setPickupTime(t); setShowTimeDrop(false); }}>
                                                                <i className="ri-time-line"></i>
                                                                <span>{t}</span>
                                                                {pickupTime === t && <i className="ri-check-line td-cs-check"></i>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Hành khách – guest picker popup */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-user-3-line"></i> Hành khách
                                            </label>
                                            <div className="td-gp-wrap" ref={guestPickerRef}>
                                                <button type="button"
                                                    className={`td-cs-btn${showGuestPicker ? ' open' : ''}`}
                                                    onClick={() => { setShowGuestPicker(v => !v); setShowFromDrop(false); setShowToDrop(false); setShowTimeDrop(false); }}>
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
                                                                <div className="td-gp-note">Từ 12 tuổi</div>
                                                            </div>
                                                            <div className="td-gp-ctrl">
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}>
                                                                    <i className="ri-subtract-line"></i>
                                                                </button>
                                                                <span className="td-gp-count">{adults}</span>
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setAdults(a => Math.min(maxPassengers - children, a + 1))}
                                                                    disabled={totalPassengers >= maxPassengers}>
                                                                    <i className="ri-add-line"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Trẻ em */}
                                                        <div className="td-gp-row">
                                                            <div className="td-gp-info">
                                                                <div className="td-gp-label">Trẻ em</div>
                                                                <div className="td-gp-note">Dưới 12 tuổi</div>
                                                            </div>
                                                            <div className="td-gp-ctrl">
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0}>
                                                                    <i className="ri-subtract-line"></i>
                                                                </button>
                                                                <span className="td-gp-count">{children}</span>
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setChildren(c => Math.min(maxPassengers - adults, c + 1))}
                                                                    disabled={totalPassengers >= maxPassengers}>
                                                                    <i className="ri-add-line"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div style={{ padding: '6px 16px 2px', fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)' }}>
                                                            <i className="ri-information-line me-1"></i>
                                                            Xe tối đa {maxPassengers} chỗ ngồi
                                                        </div>
                                                        <button type="button" className="td-gp-done"
                                                            onClick={() => setShowGuestPicker(false)}>
                                                            Xong
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Số ngày thuê – nút +/- theo DAY_OPTIONS */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-calendar-2-line"></i> Số ngày thuê
                                            </label>
                                            <div className="td-guest-ctrl">
                                                <button type="button" className="td-guest-btn"
                                                    onClick={() => setDays(DAY_OPTIONS[Math.max(0, dayIdx - 1)])}
                                                    disabled={dayIdx <= 0}>
                                                    <i className="ri-subtract-line"></i>
                                                </button>
                                                <span className="td-guest-val">{days} ngày</span>
                                                <button type="button" className="td-guest-btn"
                                                    onClick={() => setDays(DAY_OPTIONS[Math.min(DAY_OPTIONS.length - 1, dayIdx + 1)])}
                                                    disabled={dayIdx >= DAY_OPTIONS.length - 1}>
                                                    <i className="ri-add-line"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="td-breakdown">
                                            <div className="td-breakdown-row">
                                                <span>{formatVND(vehicle.price)} × {days} ngày</span>
                                                <span>{formatVND(total)}</span>
                                            </div>
                                            <div className="td-breakdown-row">
                                                <span>Thuế &amp; phí (10%)</span>
                                                <span>{formatVND(Math.round(total * 0.1))}</span>
                                            </div>
                                            <div className="td-breakdown-total">
                                                <span>Tổng cộng</span>
                                                <span className="td-breakdown-total-val">{formatVND(Math.round(total * 1.1))}</span>
                                            </div>
                                        </div>

                                        <button type="button" className="td-book-btn" onClick={handleBook}>
                                            <i className="ri-car-line"></i> Đặt xe ngay
                                        </button>

                                        <div className="td-bk-guarantees">
                                            <div className="td-bk-guarantee-item">
                                                <i className="ri-check-double-line"></i>
                                                <span>Hủy miễn phí trước 24 giờ</span>
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

export default TransportDetail;
