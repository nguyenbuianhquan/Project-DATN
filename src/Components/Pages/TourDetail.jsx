import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tourJson from '../../../src/Data/Tours.json';
import { useAuth } from '../../Context/AuthContext';

const formatVND = (vnd) => Math.round(vnd).toLocaleString('vi-VN') + ' ₫';

const TABS = [
    { label: 'Tổng quan',  icon: 'information'  },
    { label: 'Hoạt động',  icon: 'run'           },
    { label: 'Vị trí',     icon: 'map-pin-2'     },
    { label: 'Lịch trình', icon: 'calendar-2'    },
    { label: 'Đánh giá',   icon: 'star'          },
    { label: 'Bảng giá',   icon: 'price-tag-3'   },
];

const StarRow = ({ rating }) => (
    <span className="td-star-row">
        {[1, 2, 3, 4, 5].map(s => (
            <i key={s} className={`ri-star-${s <= Math.round(rating) ? 'fill' : 'line'}`}></i>
        ))}
    </span>
);

const sampleTourReviews = [
    { id: 1, name: 'Nguyễn Văn An', avatar: 'NA', rating: 5, date: '10/03/2025', comment: 'Tour tuyệt vời! Hướng dẫn viên nhiệt tình, lịch trình hợp lý. Cảnh đẹp ngoài mong đợi.' },
    { id: 2, name: 'Trần Thị Bích',  avatar: 'TB', rating: 4, date: '22/03/2025', comment: 'Chuyến đi đáng nhớ. Xe tiện nghi, khách sạn sạch. Bữa ăn ngon, đặc sản địa phương phong phú.' },
    { id: 3, name: 'Lê Minh Khoa',   avatar: 'LK', rating: 5, date: '05/04/2025', comment: 'Dịch vụ chuyên nghiệp, đúng giờ. Sẽ giới thiệu bạn bè và quay lại lần sau!' },
];

const priceTiers = [
    { label: 'Người lớn', note: 'từ 12 tuổi',  multiplier: 1.0 },
    { label: 'Trẻ em',    note: '5–11 tuổi',    multiplier: 0.7 },
    { label: 'Em bé',     note: 'dưới 5 tuổi',  multiplier: 0   },
];

const tourActivitiesMap = {
    default: [
        { icon: 'camera-3',         title: 'Chụp ảnh check-in',             desc: 'Ghi lại khoảnh khắc tại các điểm đẹp nhất của hành trình' },
        { icon: 'restaurant-2',     title: 'Thưởng thức ẩm thực địa phương', desc: 'Khám phá hương vị đặc sản truyền thống tại nhà hàng địa phương' },
        { icon: 'run',              title: 'Trekking khám phá',              desc: 'Đi bộ dã ngoại qua các con đường mòn thiên nhiên đẹp' },
        { icon: 'basketball',       title: 'Trải nghiệm thể thao',           desc: 'Các hoạt động thể thao nước và ngoài trời theo mùa' },
        { icon: 'music-2',          title: 'Giao lưu văn hóa',               desc: 'Tham gia biểu diễn nghệ thuật và văn hóa dân gian địa phương' },
        { icon: 'ancient-pavilion', title: 'Tham quan di tích',              desc: 'Khám phá các công trình lịch sử và kiến trúc độc đáo' },
    ],
};

const departureTimes = ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00'];

const TourDetailPage = () => {
    const { id }          = useParams();
    const navigate        = useNavigate();
    const { currentUser } = useAuth();

    const allTours = (() => {
        const stored = localStorage.getItem('admin_tours');
        if (!stored) return tourJson;
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && parsed[0].price < 10000) {
            localStorage.removeItem('admin_tours');
            return tourJson;
        }
        return parsed;
    })();
    const tour = allTours.find(t => String(t.id) === id);

    const [activeTab,        setActiveTab]        = useState('Tổng quan');
    const [adults,           setAdults]           = useState(1);
    const [children,         setChildren]         = useState(0);
    const [infants,          setInfants]          = useState(0);
    const [bookDate,         setBookDate]         = useState('');
    const [bookTime,         setBookTime]         = useState('07:00');
    const [showTimeDrop,     setShowTimeDrop]     = useState(false);
    const [showGuestPicker,  setShowGuestPicker]  = useState(false);
    const [lightboxSrc,      setLightboxSrc]      = useState(null);
    const [openDay,          setOpenDay]          = useState(0);
    const timeDropRef    = useRef(null);
    const guestPickerRef = useRef(null);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    // Đóng dropdown giờ và guest picker khi click ra ngoài
    useEffect(() => {
        const handler = (e) => {
            if (timeDropRef.current    && !timeDropRef.current.contains(e.target))    setShowTimeDrop(false);
            if (guestPickerRef.current && !guestPickerRef.current.contains(e.target)) setShowGuestPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!tour) {
        return (
            <div className="container py-5 text-center">
                <h4 style={{ color: '#fff' }}>Không tìm thấy tour.</h4>
                <button className="lp-btn mt-3" onClick={() => navigate('/tours')}>Quay lại</button>
            </div>
        );
    }

    const adultTotal  = tour.price * adults;
    const childTotal  = Math.round(tour.price * 0.7) * children;
    const total       = adultTotal + childTotal; // infants free
    const totalGuests = adults + children + infants;
    const guestLabel  = [
        `${adults} người lớn`,
        children > 0 ? `${children} trẻ em` : null,
        infants  > 0 ? `${infants} em bé`   : null,
    ].filter(Boolean).join(' · ');
    const activities = tourActivitiesMap.default;
    const mapQuery   = encodeURIComponent(tour.location);
    // Demo: dùng cùng 1 ảnh cho tất cả ô trong gallery
    const galleryImgs = Array(5).fill(tour.image);

    const handleBook = () => {
        if (!currentUser) { navigate('/signin'); return; }
        localStorage.setItem('bookingItem', JSON.stringify({
            id:       tour.id,
            title:    tour.title,
            image:    tour.image,
            price:    Math.round(total * 1.1),
            quantity: totalGuests,
            location: tour.location || 'Điểm đến đã chọn',
        }));
        navigate('/booking-info');
    };

    return (
        <>
            {/* ── Lightbox ── */}
            {lightboxSrc && (
                <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
                    <button className="lightbox-close" onClick={() => setLightboxSrc(null)}>
                        <i className="ri-close-line"></i>
                    </button>
                    <img
                        src={lightboxSrc}
                        alt="Ảnh phóng to"
                        className="lightbox-img"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            {/* ══════════════════════════════════════
                HEADER – breadcrumb + tiêu đề + meta
            ══════════════════════════════════════ */}
            <div className="td-page-header">
                <div className="container">
                    {/* Breadcrumb điều hướng */}
                    <nav className="td-breadcrumb">
                        <span className="td-crumb" onClick={() => navigate('/')}>Trang chủ</span>
                        <i className="ri-arrow-right-s-line"></i>
                        <span className="td-crumb" onClick={() => navigate('/tours')}>Tours</span>
                        <i className="ri-arrow-right-s-line"></i>
                        <span className="td-crumb active">{tour.title}</span>
                    </nav>

                    {/* Tiêu đề lớn */}
                    <h1 className="td-page-title">{tour.title}</h1>

                    {/* Tag nổi bật */}
                    {tour.tag && <span className="td-page-tag">{tour.tag}</span>}

                    {/* Hàng thông tin meta */}
                    <div className="td-meta-row">
                        <span className="td-meta-rating">
                            <i className="ri-star-fill"></i> {tour.rating}
                        </span>
                        {tour.reviews && (
                            <span className="td-meta-reviews">({tour.reviews} đánh giá)</span>
                        )}
                        <span className="td-meta-sep">·</span>
                        <span className="td-meta-item">
                            <i className="ri-map-pin-2-fill"></i> {tour.location}
                        </span>
                        <span className="td-meta-sep">·</span>
                        <span className="td-meta-item">
                            <i className="ri-calendar-2-line"></i> {tour.duration}
                        </span>
                        <span className="td-meta-sep">·</span>
                        <span className="td-meta-item">
                            <i className="ri-user-3-line"></i> {tour.persons}
                        </span>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════
                GALLERY – 1 ảnh lớn + lưới 2×2 nhỏ
            ══════════════════════════════════════ */}
            <div className="td-gallery-section">
                <div className="container">
                    <div className="td-gallery-grid">
                        {/* Ảnh lớn bên trái */}
                        <div
                            className="td-gallery-main"
                            onClick={() => setLightboxSrc(galleryImgs[0])}
                            title="Nhấn để phóng to"
                        >
                            <img src={galleryImgs[0]} alt={tour.title} className="td-gallery-img" />
                        </div>

                        {/* Lưới 2×2 bên phải */}
                        <div className="td-gallery-thumbs">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="td-gallery-thumb"
                                    onClick={() => setLightboxSrc(galleryImgs[i] || galleryImgs[0])}
                                >
                                    <img
                                        src={galleryImgs[i] || galleryImgs[0]}
                                        alt={`Ảnh ${i + 1}`}
                                        className="td-gallery-img"
                                    />
                                    {/* Overlay "Xem tất cả" ở ô cuối */}
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

            {/* ══════════════════════════════════════
                BODY – tabs + nội dung + booking
            ══════════════════════════════════════ */}
            <div className="td-body">
                <div className="container">

                    {/* Tab navigation */}
                    <div className="td-tabs-wrap">
                        <div className="td-tabs">
                            {TABS.map(tab => (
                                <button
                                    key={tab.label}
                                    className={`td-tab${activeTab === tab.label ? ' active' : ''}`}
                                    onClick={() => setActiveTab(tab.label)}
                                >
                                    <i className={`ri-${tab.icon}-line`}></i>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="row g-4 mt-2">

                        {/* ══ CỘT NỘI DUNG TRÁI (8/12) ══ */}
                        <div className="col-lg-8">

                            {/* ──── Tổng quan ──── */}
                            {activeTab === 'Tổng quan' && (
                                <div className="d-flex flex-column gap-4">
                                    <section className="td-section">
                                        <h5 className="td-section-title">
                                            <i className="ri-file-text-line"></i> Giới thiệu
                                        </h5>
                                        <p className="td-para">
                                            Khám phá vẻ đẹp tuyệt vời của <strong>{tour.location}</strong> qua hành trình{' '}
                                            <strong>{tour.duration}</strong> đáng nhớ. Tour được thiết kế dành cho{' '}
                                            <strong>{tour.persons}</strong>, mang lại trải nghiệm trọn vẹn từ phong cảnh
                                            thiên nhiên hùng vĩ đến văn hóa địa phương đặc sắc.
                                        </p>
                                        <p className="td-para">
                                            Với đội ngũ hướng dẫn viên chuyên nghiệp, am hiểu địa phương và lịch trình linh hoạt,
                                            bạn sẽ được tận hưởng chuyến đi an toàn, thoải mái và đầy cảm xúc.
                                        </p>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title">
                                            <i className="ri-calendar-2-line"></i> Ngày &amp; Giờ khởi hành
                                        </h5>
                                        <div className="td-depart-grid">
                                            {[
                                                { icon: 'calendar-2', label: 'Ngày khởi hành',  value: 'Thứ 2, 4, 6 & Thứ 7 hàng tuần' },
                                                { icon: 'time',       label: 'Giờ khởi hành',   value: '07:00 sáng từ điểm tập kết'    },
                                                { icon: 'map-pin-2',  label: 'Điểm khởi hành',  value: 'TP. Hồ Chí Minh hoặc Hà Nội'  },
                                                { icon: 'group',      label: 'Quy mô nhóm',     value: tour.persons                    },
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
                                        <h5 className="td-section-title">
                                            <i className="ri-list-check-3"></i> Dịch vụ bao gồm
                                        </h5>
                                        <div className="td-include-grid">
                                            <div className="td-include-card td-include-yes">
                                                <div className="td-include-head">
                                                    <i className="ri-checkbox-circle-fill"></i> Bao gồm
                                                </div>
                                                <ul className="td-include-list">
                                                    <li><i className="ri-check-line"></i>Bữa sáng &amp; bữa tối</li>
                                                    <li><i className="ri-check-line"></i>Vé tham quan tất cả điểm</li>
                                                    <li><i className="ri-check-line"></i>Hướng dẫn viên song ngữ</li>
                                                    <li><i className="ri-check-line"></i>Xe đưa đón tiêu chuẩn</li>
                                                    <li><i className="ri-check-line"></i>Bảo hiểm du lịch</li>
                                                </ul>
                                            </div>
                                            <div className="td-include-card td-include-no">
                                                <div className="td-include-head">
                                                    <i className="ri-close-circle-fill"></i> Không bao gồm
                                                </div>
                                                <ul className="td-include-list">
                                                    <li><i className="ri-close-line"></i>Chi phí cá nhân</li>
                                                    <li><i className="ri-close-line"></i>Hoạt động ngoài lịch trình</li>
                                                    <li><i className="ri-close-line"></i>Đồ uống có cồn</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title">
                                            <i className="ri-shield-check-line"></i> Chính sách hủy tour
                                        </h5>
                                        <div className="td-cancel-list">
                                            {[
                                                { color: 'green',  title: 'Hủy trước 7 ngày',    desc: 'Hoàn tiền 100%' },
                                                { color: 'yellow', title: 'Hủy trước 3–7 ngày',   desc: 'Hoàn tiền 50%'  },
                                                { color: 'red',    title: 'Hủy trong vòng 3 ngày', desc: 'Không hoàn tiền' },
                                            ].map((item, i) => (
                                                <div className={`td-cancel-item ${item.color}`} key={i}>
                                                    <div className={`td-cancel-dot ${item.color}`}></div>
                                                    <div>
                                                        <strong>{item.title}</strong>
                                                        <span> — {item.desc}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* ──── Hoạt động ──── */}
                            {activeTab === 'Hoạt động' && (
                                <div className="d-flex flex-column gap-4">
                                    <section className="td-section">
                                        <h5 className="td-section-title">
                                            <i className="ri-run-line"></i> Các hoạt động trong tour
                                        </h5>
                                        <p className="td-para mb-3">
                                            Hành trình <strong>{tour.duration}</strong> tại <strong>{tour.location}</strong> bao gồm:
                                        </p>
                                        <div className="row g-3">
                                            {activities.map((act, i) => (
                                                <div className="col-md-6" key={i}>
                                                    <div className="td-act-card">
                                                        <div className="td-act-icon">
                                                            <i className={`ri-${act.icon}-line`}></i>
                                                        </div>
                                                        <div>
                                                            <div className="td-act-title">{act.title}</div>
                                                            <div className="td-act-desc">{act.desc}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title">
                                            <i className="ri-bus-2-line"></i> Lịch khởi hành theo tuần
                                        </h5>
                                        <div className="price-table-wrap">
                                            <table className="price-table">
                                                <thead>
                                                    <tr>
                                                        <th>Ngày khởi hành</th>
                                                        <th>Giờ tập kết</th>
                                                        <th>Giờ khởi hành</th>
                                                        <th>Tình trạng</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { days: 'Thứ 2 & Thứ 5', gather: '06:30', depart: '07:00', ok: true  },
                                                        { days: 'Thứ 3 & Thứ 6', gather: '06:00', depart: '06:30', ok: true  },
                                                        { days: 'Thứ 4 & Thứ 7', gather: '05:30', depart: '06:00', ok: false },
                                                        { days: 'Chủ nhật',       gather: '07:00', depart: '07:30', ok: true  },
                                                    ].map((row, i) => (
                                                        <tr key={i}>
                                                            <td style={{ fontWeight: 600, color: '#fff' }}>{row.days}</td>
                                                            <td>{row.gather}</td>
                                                            <td>{row.depart}</td>
                                                            <td>
                                                                <span className={`room-avail-badge ${row.ok ? 'ok' : 'no'}`}>
                                                                    {row.ok ? 'Còn chỗ' : 'Gần hết'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* ──── Vị trí ──── */}
                            {activeTab === 'Vị trí' && (
                                <div className="d-flex flex-column gap-4">
                                    <section className="td-section">
                                        <h5 className="td-section-title">
                                            <i className="ri-map-2-line"></i> Điểm đến trên bản đồ
                                        </h5>
                                        <div className="td-map-wrap">
                                            <iframe
                                                title="Bản đồ điểm đến"
                                                src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&z=12`}
                                                width="100%"
                                                height="320"
                                                style={{ border: 0, borderRadius: 12, display: 'block' }}
                                                allowFullScreen=""
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="row g-3 mt-1">
                                            {[
                                                { icon: 'map-pin-2', label: 'Điểm khởi hành', value: 'TP. HCM / Hà Nội' },
                                                { icon: 'flag',      label: 'Điểm đến',       value: tour.location       },
                                                { icon: 'time',      label: 'Thời gian',      value: tour.duration       },
                                                { icon: 'user-3',    label: 'Nhóm',           value: tour.persons        },
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
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="lp-btn lp-btn-outline mt-3 d-inline-flex align-items-center gap-2"
                                        >
                                            <i className="ri-external-link-line"></i> Mở trong Google Maps
                                        </a>
                                    </section>
                                </div>
                            )}

                            {/* ──── Lịch trình ──── */}
                            {activeTab === 'Lịch trình' && (() => {
                                const durationNum = parseInt(tour.duration) || 3;
                                const itinerary = [
                                    {
                                        title: 'Ngày 1 – Khởi hành & Khám phá',
                                        icon: 'map-2', color: '#f26f55',
                                        events: [
                                            { time: '07:00', desc: 'Tập kết tại điểm xuất phát, xe đón theo lịch.' },
                                            { time: '10:00', desc: `Đến ${tour.location}, nhận phòng, nghỉ ngơi.` },
                                            { time: '14:00', desc: 'Tham quan các điểm nổi bật đầu tiên.' },
                                            { time: '19:00', desc: 'Bữa tối chào mừng tại nhà hàng địa phương.' },
                                        ],
                                    },
                                    {
                                        title: 'Ngày 2 – Trải nghiệm văn hóa',
                                        icon: 'compass-2', color: '#f6c948',
                                        events: [
                                            { time: '07:00', desc: 'Bữa sáng buffet tại khách sạn.' },
                                            { time: '08:30', desc: `Khám phá văn hóa và thắng cảnh chính của ${tour.location}.` },
                                            { time: '12:30', desc: 'Bữa trưa đặc sản địa phương.' },
                                            { time: '14:00', desc: 'Tham gia các hoạt động trải nghiệm tự chọn.' },
                                            { time: '20:00', desc: 'Giao lưu văn nghệ với người dân địa phương.' },
                                        ],
                                    },
                                    {
                                        title: 'Ngày 3 – Tham quan & Trở về',
                                        icon: 'flight-takeoff', color: '#4ade80',
                                        events: [
                                            { time: '07:00', desc: 'Bữa sáng, trả phòng, mua sắm quà lưu niệm.' },
                                            { time: '09:00', desc: 'Tham quan điểm cuối hành trình.' },
                                            { time: '12:00', desc: 'Bữa trưa chia tay.' },
                                            { time: '14:00', desc: 'Xe đưa về điểm xuất phát, kết thúc tour.' },
                                        ],
                                    },
                                ].slice(0, durationNum);

                                return (
                                    <section className="td-section">
                                        <h5 className="td-section-title">
                                            <i className="ri-route-line"></i> Lịch trình chi tiết
                                        </h5>
                                        <div className="d-flex flex-column gap-3 mt-3">
                                            {itinerary.map((day, index) => (
                                                <div
                                                    key={index}
                                                    className="td-itinerary-item"
                                                    style={{ '--day-color': day.color }}
                                                >
                                                    <button
                                                        className={`td-itinerary-header${openDay === index ? ' open' : ''}`}
                                                        onClick={() => setOpenDay(openDay === index ? -1 : index)}
                                                    >
                                                        <span className="td-itinerary-icon">
                                                            <i className={`ri-${day.icon}-line`}></i>
                                                        </span>
                                                        <span className="td-itinerary-label">{day.title}</span>
                                                        <i className={`ri-arrow-${openDay === index ? 'up' : 'down'}-s-line td-itinerary-arrow`}></i>
                                                    </button>
                                                    {openDay === index && (
                                                        <div className="td-itinerary-body">
                                                            <div className="td-timeline">
                                                                {day.events.map((ev, ei) => (
                                                                    <div className="td-timeline-item" key={ei}>
                                                                        <div className="td-timeline-dot"></div>
                                                                        <span className="td-timeline-time">{ev.time}</span>
                                                                        <span className="td-timeline-desc">{ev.desc}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="td-itinerary-footer">
                                                                <span><i className="ri-bus-2-line"></i>Xe điều hòa</span>
                                                                <span><i className="ri-restaurant-line"></i>Bữa ăn theo lịch</span>
                                                                <span><i className="ri-user-star-line"></i>HDV đồng hành</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })()}

                            {/* ──── Đánh giá ──── */}
                            {activeTab === 'Đánh giá' && (
                                <div className="d-flex flex-column gap-4">
                                    <div className="td-rating-summary">
                                        <div className="td-rating-score">{tour.rating}</div>
                                        <div className="td-rating-detail">
                                            <StarRow rating={tour.rating} />
                                            <div className="td-rating-label">
                                                {tour.rating >= 4.8 ? 'Xuất sắc' : tour.rating >= 4.5 ? 'Tuyệt vời' : 'Rất tốt'}
                                            </div>
                                            <div className="td-rating-count">{tour.reviews} đánh giá</div>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        {sampleTourReviews.map(rev => (
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

                            {/* ──── Bảng giá ──── */}
                            {activeTab === 'Bảng giá' && (
                                <section className="td-section">
                                    <h5 className="td-section-title">
                                        <i className="ri-price-tag-3-line"></i> Bảng giá tour
                                    </h5>
                                    <div className="price-table-wrap mt-3">
                                        <table className="price-table">
                                            <thead>
                                                <tr>
                                                    <th>Đối tượng</th>
                                                    <th>Ghi chú</th>
                                                    <th>Giá/người (VNĐ)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {priceTiers.map((tier, i) => (
                                                    <tr key={i} className={tier.multiplier === 0 ? 'price-row-unavail' : ''}>
                                                        <td style={{ fontWeight: 600, color: '#fff' }}>{tier.label}</td>
                                                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>{tier.note}</td>
                                                        <td>
                                                            {tier.multiplier === 0 ? (
                                                                <span style={{ color: '#4ade80', fontWeight: 700 }}>Miễn phí</span>
                                                            ) : (
                                                                <span className="price-table-vnd">{formatVND(tour.price * tier.multiplier)}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="price-note-box mt-3">
                                        <i className="ri-information-line"></i>
                                        Giá đã bao gồm: vé tham quan, bữa ăn, xe đưa đón, hướng dẫn viên và bảo hiểm du lịch.
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* ══ BOOKING WIDGET (cột phải 4/12) ══ */}
                        <div className="col-lg-4">
                            <div className="td-bk-sticky">
                                <div className="td-bk-card">

                                    {/* Header: giá + badge */}
                                    <div className="td-bk-header">
                                        <div>
                                            <div className="td-bk-from">Giá từ</div>
                                            <div className="td-bk-price">{formatVND(tour.price)}</div>
                                            <div className="td-bk-unit">/người</div>
                                        </div>
                                        <div className="td-bk-verified">
                                            <i className="ri-shield-check-fill"></i>
                                            <span>Đã xác thực</span>
                                        </div>
                                    </div>

                                    {/* Form */}
                                    <div className="td-bk-body">

                                        {/* Ngày khởi hành */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-calendar-2-line"></i> Ngày khởi hành
                                            </label>
                                            <input
                                                type="date"
                                                className="td-bk-input"
                                                value={bookDate}
                                                onChange={e => setBookDate(e.target.value)}
                                            />
                                        </div>

                                        {/* Giờ khởi hành – custom dropdown thay native select */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-time-line"></i> Giờ khởi hành
                                            </label>
                                            <div className="td-cs-wrap" ref={timeDropRef}>
                                                <button
                                                    type="button"
                                                    className={`td-cs-btn${showTimeDrop ? ' open' : ''}`}
                                                    onClick={() => setShowTimeDrop(v => !v)}
                                                >
                                                    <i className="ri-time-line"></i>
                                                    <span>{bookTime} sáng</span>
                                                    <i className={`ri-arrow-${showTimeDrop ? 'up' : 'down'}-s-line td-cs-arrow`}></i>
                                                </button>
                                                {showTimeDrop && (
                                                    <div className="td-cs-options">
                                                        {departureTimes.map(t => (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                className={`td-cs-option${bookTime === t ? ' selected' : ''}`}
                                                                onClick={() => { setBookTime(t); setShowTimeDrop(false); }}
                                                            >
                                                                <i className="ri-time-line"></i>
                                                                <span>{t} sáng</span>
                                                                {bookTime === t && <i className="ri-check-line td-cs-check"></i>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Số khách – guest picker popup */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-user-3-line"></i> Số khách
                                            </label>
                                            <div className="td-gp-wrap" ref={guestPickerRef}>
                                                <button
                                                    type="button"
                                                    className={`td-cs-btn${showGuestPicker ? ' open' : ''}`}
                                                    onClick={() => setShowGuestPicker(v => !v)}
                                                >
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
                                                                    onClick={() => setAdults(Math.min(10, adults + 1))} disabled={adults >= 10}>
                                                                    <i className="ri-add-line"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Trẻ em */}
                                                        <div className="td-gp-row">
                                                            <div className="td-gp-info">
                                                                <div className="td-gp-label">Trẻ em</div>
                                                                <div className="td-gp-note">5 – 11 tuổi · 70% giá</div>
                                                            </div>
                                                            <div className="td-gp-ctrl">
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0}>
                                                                    <i className="ri-subtract-line"></i>
                                                                </button>
                                                                <span className="td-gp-count">{children}</span>
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setChildren(Math.min(10, children + 1))} disabled={children >= 10}>
                                                                    <i className="ri-add-line"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Em bé */}
                                                        <div className="td-gp-row">
                                                            <div className="td-gp-info">
                                                                <div className="td-gp-label">Em bé</div>
                                                                <div className="td-gp-note">Dưới 5 tuổi · Miễn phí</div>
                                                            </div>
                                                            <div className="td-gp-ctrl">
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setInfants(Math.max(0, infants - 1))} disabled={infants <= 0}>
                                                                    <i className="ri-subtract-line"></i>
                                                                </button>
                                                                <span className="td-gp-count">{infants}</span>
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setInfants(Math.min(5, infants + 1))} disabled={infants >= 5}>
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

                                        {/* Phân tích giá */}
                                        <div className="td-breakdown">
                                            <div className="td-breakdown-row">
                                                <span>{formatVND(tour.price)} × {adults} người lớn</span>
                                                <span>{formatVND(adultTotal)}</span>
                                            </div>
                                            {children > 0 && (
                                                <div className="td-breakdown-row">
                                                    <span>{formatVND(Math.round(tour.price * 0.7))} × {children} trẻ em</span>
                                                    <span>{formatVND(childTotal)}</span>
                                                </div>
                                            )}
                                            {infants > 0 && (
                                                <div className="td-breakdown-row">
                                                    <span>{infants} em bé</span>
                                                    <span style={{ color: '#4ade80' }}>Miễn phí</span>
                                                </div>
                                            )}
                                            <div className="td-breakdown-row">
                                                <span>Thuế &amp; phí (10%)</span>
                                                <span>{formatVND(Math.round(total * 0.1))}</span>
                                            </div>
                                            <div className="td-breakdown-total">
                                                <span>Tổng cộng</span>
                                                <span className="td-breakdown-total-val">
                                                    {formatVND(Math.round(total * 1.1))}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Nút đặt */}
                                        <button type="button" className="td-book-btn" onClick={handleBook}>
                                            <i className="ri-calendar-check-line"></i>
                                            Đặt ngay
                                        </button>

                                        {/* Cam kết */}
                                        <div className="td-bk-guarantees">
                                            <div className="td-bk-guarantee-item">
                                                <i className="ri-check-double-line"></i>
                                                <span>Hủy miễn phí trước 7 ngày</span>
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

export default TourDetailPage;
