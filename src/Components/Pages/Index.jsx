import React, { useEffect, useState, useContext, useRef } from "react";
import { CartContext } from "../../Context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import bgvideo from '../../assets/travel1.mp4';
import user1 from '../../assets/user-1.jpeg';
import user2 from '../../assets/user-2.png';
import user3 from '../../assets/user-3.png';
import user4 from '../../assets/user-4.jpeg';

import hand from '../../assets/hand.png'

import destination1 from '../../assets/destination-1.png'
import destination2 from '../../assets/destination-2.png'
import destination3 from '../../assets/destination-3.jpeg'
import destination4 from '../../assets/destination-4.png'
import destination5 from '../../assets/destination-5.png'
import destination6 from '../../assets/destination-6.png'
import destination7 from '../../assets/destination-7.png'

import Explore1 from '../../assets/explore-1.svg'
import Explore2 from '../../assets/explore-2.svg'
import Explore3 from '../../assets/explore-3.svg'
import Explore4 from '../../assets/explore-4.svg'
import Explore5 from '../../assets/explore-5.svg'

import exploreImg1 from '../../assets/explore-img1.png'
import exploreImg2 from '../../assets/explore-img2.png'
import exploreImg3 from '../../assets/explore-img3.png'
import exploreImg4 from '../../assets/explore-img4.png'
import exploreImg5 from '../../assets/explore-img5.png'




import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";



import tourData from "../../../src/Data/Tours.json";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



function Index() {
    const [tours, setTours] = useState([]);
    const [visibleCount, setVisibleCount] = useState(6);
    const { cartItems, addToCart } = useContext(CartContext);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Search bar state
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [hoverDate, setHoverDate] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const calendarRef = useRef(null);

    const [guestOpen, setGuestOpen] = useState(false);
    const [rooms, setRooms] = useState(1);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);

    const [destOpen,   setDestOpen]   = useState(false);
    const [destSearch, setDestSearch] = useState('');
    const [destValue,  setDestValue]  = useState('');
    const [destError,  setDestError]  = useState(false);
    const [searchTab,  setSearchTab]  = useState('hotels');
    const destRef = useRef(null);

    const POPULAR_DEST = [
        { name: 'Hà Nội',           country: 'Việt Nam' },
        { name: 'Hạ Long',          country: 'Việt Nam' },
        { name: 'Ninh Bình',        country: 'Việt Nam' },
        { name: 'TP. Hồ Chí Minh', country: 'Việt Nam' },
        { name: 'Đà Nẵng',          country: 'Việt Nam' },
        { name: 'Đà Lạt',           country: 'Việt Nam' },
        { name: 'Phú Quốc',         country: 'Việt Nam' },
    ];
    const filteredDest = POPULAR_DEST.filter(d =>
        d.name.toLowerCase().includes(destSearch.toLowerCase()) ||
        d.country.toLowerCase().includes(destSearch.toLowerCase())
    );

    const formatDate = (val) => {
        if (!val) return null;
        const d = new Date(val + 'T00:00:00');
        const days = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
        return {
            main: d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }),
            sub: days[d.getDay()],
        };
    };

    const guestSummary = `${adults} người lớn${children > 0 ? `, ${children} trẻ em` : ''} · ${rooms} phòng`;

    // Close calendar on outside click
    useEffect(() => {
        const handler = (e) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target)) {
                setCalendarOpen(false);
                setHoverDate('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close destination dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (destRef.current && !destRef.current.contains(e.target)) {
                setDestOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleDateClick = (dateStr) => {
        if (!dateFrom || (dateFrom && dateTo)) {
            setDateFrom(dateStr);
            setDateTo('');
            setHoverDate('');
        } else {
            if (dateStr > dateFrom) {
                setDateTo(dateStr);
                setHoverDate('');
                setCalendarOpen(false);
            } else {
                setDateFrom(dateStr);
                setDateTo('');
                setHoverDate('');
            }
        }
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const month2 = viewMonth === 11 ? 0 : viewMonth + 1;
    const year2  = viewMonth === 11 ? viewYear + 1 : viewYear;

    const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                         'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
    const DAY_NAMES = ['T2','T3','T4','T5','T6','T7','CN'];

    const renderMonth = (year, month) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay    = (new Date(year, month, 1).getDay() + 6) % 7;
        const today       = new Date(); today.setHours(0,0,0,0);
        const effectiveTo = dateTo || hoverDate;

        const cells = [...Array(firstDay).fill(null),
                       ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

        return (
            <div className="cal-month" key={`${year}-${month}`}>
                <div className="cal-month-title">{MONTH_NAMES[month]} {year}</div>
                <div className="cal-week-header">
                    {DAY_NAMES.map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="cal-grid">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={idx} className="cal-cell empty" />;
                        const ds  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                        const dt  = new Date(ds + 'T00:00:00');
                        const isPast    = dt < today;
                        const isStart   = ds === dateFrom;
                        const isEnd     = ds === dateTo;
                        const inRange   = dateFrom && effectiveTo && ds > dateFrom && ds < effectiveTo;
                        const isToday   = dt.getTime() === today.getTime();
                        const isHover   = ds === hoverDate && !dateTo;
                        const classes   = ['cal-cell',
                            isPast  ? 'cal-past'  : '',
                            isStart ? 'cal-start'  : '',
                            isEnd   ? 'cal-end'    : '',
                            inRange ? 'cal-range'  : '',
                            isToday ? 'cal-today'  : '',
                            isHover ? 'cal-hover'  : '',
                        ].filter(Boolean).join(' ');
                        return (
                            <div key={idx} className={classes}
                                onClick={() => !isPast && handleDateClick(ds)}
                                onMouseEnter={() => !isPast && dateFrom && !dateTo && setHoverDate(ds)}
                                onMouseLeave={() => setHoverDate('')}
                            >{day}</div>
                        );
                    })}
                </div>
            </div>
        );
    };

    useEffect(() => {
        setTours(tourData);
    }, []);

    const handleSearch = () => {
        if (!destValue.trim()) {
            setDestError(true);
            destRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setDestError(false);
        const params = new URLSearchParams();
        params.set('dest', destValue);
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        params.set('adults', String(adults));
        params.set('children', String(children));
        params.set('rooms', String(rooms));
        const route = searchTab === 'tours' ? '/tours' : searchTab === 'transport' ? '/transport' : searchTab === 'restaurants' ? '/Restaurants' : '/hotels';
        navigate(route + '?' + params.toString());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBookNow = (tour) => {
        if (!currentUser) { navigate("/signin"); return; }
        const alreadyInCart = cartItems.find((item) => item.id === tour.id);
        if (alreadyInCart) {
            toast.error("Tour đã có trong giỏ hàng");
        } else {
            addToCart({ ...tour, quantity: 1 });
            toast.success("Đã thêm tour vào giỏ hàng!");
        }
    };


    const [activeIndex, setActiveIndex] = useState(0);

    const tabs = [
        { title: 'Câu Cá & Bơi Lội',      icon: 'ri-water-flash-line',    exploreImg: exploreImg1, desc: 'Thư giãn bên hồ núi và dòng suối trong lành cùng đội ngũ hướng dẫn viên chuyên nghiệp của DAYTRIP.' },
        { title: 'Chèo Thuyền & Kayak',    icon: 'ri-sailboat-line',       exploreImg: exploreImg2, desc: 'Chinh phục sóng nước, khám phá hang động biển và vịnh đảo huyền bí từ góc nhìn mặt nước.' },
        { title: 'Thể Thao & Phiêu Lưu',  icon: 'ri-run-line',            exploreImg: exploreImg3, desc: 'Thử thách giới hạn bản thân qua các hoạt động thể chất cường độ cao giữa thiên nhiên hoang dã.' },
        { title: 'Leo Núi & Trekking',      icon: 'ri-compass-3-line',     exploreImg: exploreImg4, desc: 'Chinh phục những đỉnh núi hùng vĩ và các cung đường trekking đẹp nhất Việt Nam.' },
        { title: 'Dù Lượn & Bay Tự Do',    icon: 'ri-flight-takeoff-line', exploreImg: exploreImg5, desc: 'Cảm giác tự do tuyệt đối khi lượn trên bầu trời và ngắm toàn cảnh núi non hùng vĩ từ trên cao.' },
        { title: 'Âm Nhạc & Thư Giãn',    icon: 'ri-music-2-line',        exploreImg: exploreImg2, desc: 'Buông thả tâm hồn với lễ hội âm nhạc, spa thiên nhiên và trải nghiệm nghỉ dưỡng cao cấp.' },
        { title: 'Khám Phá Hang Động',      icon: 'ri-flashlight-line',    exploreImg: exploreImg4, desc: 'Khám phá hệ thống hang động kỳ ảo với nhũ đá và ánh sáng lung linh sâu trong lòng đất.' },
        { title: 'Lặn Biển & Snorkeling',  icon: 'ri-drop-line',           exploreImg: exploreImg1, desc: 'Khám phá thế giới dưới nước đầy màu sắc với rạn san hô và hàng trăm loài sinh vật biển phong phú.' },
    ];


    const formatVND = (price) => price.toLocaleString('vi-VN') + ' ₫';

    return (
        <>
            <div>
                <ToastContainer position="top-right" autoClose={2500} theme="dark" />
                <div className="hero-header section">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="hero-video"
                    >
                        <source src={bgvideo} type="video/mp4" />
                    </video>

                    <div className="hero-overlay text-white">
                        <div className="container">
                            <div className="row">
                                <div className="col-xl-7 col-lg-10">
                                    {/* Badge */}
                                    <div className="hero-badge">
                                        <i className="bi bi-airplane-fill me-2"></i>
                                        Nền tảng du lịch tin cậy hàng đầu Việt Nam
                                    </div>

                                    {/* Slogan */}
                                    <h1 className="hero-title">
                                        Lên Kế Hoạch Chuyến Đi<br />
                                        <span className="hero-title-accent">Trong Tích Tắc!</span>
                                    </h1>
                                    <p className="hero-description">
                                        Hãy để DAYTRIP đồng hành cùng bạn — từ tìm điểm đến, đặt phòng đến trải nghiệm những khoảnh khắc không thể quên trên khắp thế giới.
                                    </p>

                                    {/* Stats row */}
                                    <div className="hero-stats">
                                        <div className="hero-stat-item">
                                            <div className="users">
                                                <img src={user1} className='user-img' alt="" />
                                                <img src={user2} className='user-img' alt="" />
                                                <img src={user3} className='user-img' alt="" />
                                                <img src={user4} className='user-img' alt="" />
                                                <span>5k+</span>
                                            </div>
                                            <p className="m-0 ps-2 fw-semibold fs-6">
                                                Khách Hài Lòng&nbsp;
                                                <img src={hand} alt="" width={22} style={{ verticalAlign: 'middle' }} />
                                            </p>
                                        </div>
                                        <div className="hero-stat-divider"></div>
                                        <div className="hero-stat-num">
                                            <span className="hero-stat-big">150+</span>
                                            <span className="hero-stat-sub">Điểm Đến</span>
                                        </div>
                                        <div className="hero-stat-divider"></div>
                                        <div className="hero-stat-num">
                                            <span className="hero-stat-big">4.9 <i className="ri-star-fill text-warning" style={{ fontSize: '0.7em' }}></i></span>
                                            <span className="hero-stat-sub">Đánh Giá TB</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Search Box (Agoda/Booking style) ── */}
                        <div className="container sb-wrap">
                            {/* Service tabs */}
                            <div className="sb-tabs">
                                {[
                                    { key: 'hotels',      icon: 'bi-building',       label: 'Khách Sạn' },
                                    { key: 'tours',       icon: 'bi-compass',        label: 'Tours' },
                                    { key: 'transport',   icon: 'bi-car-front-fill', label: 'Di Chuyển' },
                                    { key: 'restaurants', icon: 'bi-egg-fried',      label: 'Ẩm Thực' },
                                ].map(t => (
                                    <button
                                        key={t.key}
                                        className={`sb-tab${searchTab === t.key ? ' active' : ''}`}
                                        onClick={() => setSearchTab(t.key)}
                                    >
                                        <i className={`bi ${t.icon}`}></i>
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* White search card */}
                            <div className="sb-card">
                                {/* Destination */}
                                <div className={`sb-field sb-dest${destError ? ' sb-field-error' : ''}`} ref={destRef}>
                                    <div className="sb-field-inner" onClick={() => { setDestOpen(o => !o); setDestError(false); }}>
                                        <i className="bi bi-geo-alt-fill sb-icon"></i>
                                        <div className="sb-content">
                                            <span className="sb-label">Điểm đến</span>
                                            {destValue
                                                ? <span className="sb-value">{destValue}</span>
                                                : <span className="sb-placeholder">Bạn muốn đến đâu?</span>}
                                        </div>
                                        {destValue && (
                                            <button className="sb-clear" onClick={e => { e.stopPropagation(); setDestValue(''); }}>
                                                <i className="bi bi-x-circle-fill"></i>
                                            </button>
                                        )}
                                    </div>
                                    {destError && (
                                        <div className="sb-error-msg">
                                            <i className="bi bi-exclamation-circle-fill me-1"></i>
                                            Vui lòng chọn điểm đến
                                        </div>
                                    )}

                                    {destOpen && (
                                        <div className="tf-dest-dropdown" onClick={e => e.stopPropagation()}>
                                            <div className="tf-dest-search-wrap">
                                                <i className="bi bi-search tf-dest-search-icon"></i>
                                                <input
                                                    className="tf-dest-search"
                                                    placeholder="Nhập tên thành phố, điểm đến..."
                                                    value={destSearch}
                                                    onChange={e => setDestSearch(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="tf-dest-near" onClick={() => { setDestValue('Xung quanh vị trí của bạn'); setDestOpen(false); setDestSearch(''); setDestError(false); }}>
                                                <i className="bi bi-cursor-fill tf-dest-near-icon"></i>
                                                <span>Xung quanh vị trí của bạn</span>
                                            </div>
                                            {filteredDest.length > 0 && (
                                                <>
                                                    <div className="tf-dest-section-title">Điểm đến thịnh hành</div>
                                                    {filteredDest.map(d => (
                                                        <div key={d.name} className="tf-dest-item"
                                                            onClick={() => { setDestValue(`${d.name}, ${d.country}`); setDestOpen(false); setDestSearch(''); setDestError(false); }}>
                                                            <i className="bi bi-geo-alt tf-dest-item-icon"></i>
                                                            <div>
                                                                <div className="tf-dest-item-name">{d.name}</div>
                                                                <div className="tf-dest-item-sub">{d.country}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                            {filteredDest.length === 0 && (
                                                <div className="tf-dest-empty">Không tìm thấy điểm đến phù hợp</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="sb-divider"></div>

                                {/* Check-in / Check-out */}
                                <div className="sb-field sb-dates" ref={calendarRef}>
                                    <div className="sb-dates-inner" onClick={() => setCalendarOpen(o => !o)}>
                                        <div className="sb-date-half">
                                            <i className="bi bi-calendar3 sb-icon"></i>
                                            <div className="sb-content">
                                                <span className="sb-label">Nhận phòng</span>
                                                {formatDate(dateFrom)
                                                    ? <span className="sb-value">{formatDate(dateFrom).main}</span>
                                                    : <span className="sb-placeholder">Chọn ngày</span>}
                                            </div>
                                        </div>
                                        <div className="sb-date-sep">
                                            <i className="bi bi-arrow-right"></i>
                                        </div>
                                        <div className="sb-date-half">
                                            <i className="bi bi-calendar3-range sb-icon"></i>
                                            <div className="sb-content">
                                                <span className="sb-label">Trả phòng</span>
                                                {formatDate(dateTo)
                                                    ? <span className="sb-value">{formatDate(dateTo).main}</span>
                                                    : <span className="sb-placeholder">Chọn ngày</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {calendarOpen && (
                                        <div className="cal-popup" onClick={e => e.stopPropagation()}>
                                            <div className="cal-nav">
                                                <button className="cal-arrow" onClick={prevMonth}><i className="bi bi-chevron-left"></i></button>
                                                <div className="cal-months-wrap">
                                                    {renderMonth(viewYear, viewMonth)}
                                                    {renderMonth(year2, month2)}
                                                </div>
                                                <button className="cal-arrow" onClick={nextMonth}><i className="bi bi-chevron-right"></i></button>
                                            </div>
                                            {dateFrom && !dateTo && <p className="cal-hint">Chọn ngày trả phòng</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="sb-divider"></div>

                                {/* Guests */}
                                <div className="sb-field sb-guests tf-guest-field" onClick={() => setGuestOpen(o => !o)}>
                                    <div className="sb-field-inner">
                                        <i className="bi bi-people-fill sb-icon"></i>
                                        <div className="sb-content">
                                            <span className="sb-label">Khách &amp; Phòng</span>
                                            <span className="sb-value">{guestSummary}</span>
                                        </div>
                                    </div>
                                    {guestOpen && (
                                        <div className="guest-popup" onClick={e => e.stopPropagation()}>
                                            {[
                                                { label: 'Phòng',      sub: null,               val: rooms,    set: setRooms,    min: 1 },
                                                { label: 'Người lớn',  sub: '18 tuổi trở lên',  val: adults,   set: setAdults,   min: 1 },
                                                { label: 'Trẻ em',     sub: '0–17 tuổi',        val: children, set: setChildren, min: 0 },
                                            ].map(({ label, sub, val, set, min }) => (
                                                <div className="guest-row" key={label}>
                                                    <div>
                                                        <p className="guest-row-label">{label}</p>
                                                        {sub && <p className="guest-row-sub">{sub}</p>}
                                                    </div>
                                                    <div className="guest-counter">
                                                        <button className="gc-btn" onClick={() => set(v => Math.max(min, v - 1))}><i className="bi bi-dash"></i></button>
                                                        <span className="gc-num">{val}</span>
                                                        <button className="gc-btn" onClick={() => set(v => v + 1)}><i className="bi bi-plus"></i></button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button className="guest-done-btn" onClick={() => setGuestOpen(false)}>Xong</button>
                                        </div>
                                    )}
                                </div>

                                {/* Search button */}
                                <button className="sb-search-btn" onClick={handleSearch}>
                                    <i className="bi bi-search"></i>
                                    <span>Tìm kiếm</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="banner-container section">
                    <div className="container">
                        <div className="row text-center mb-5">
                            <div className="section-title">
                                <p>Ưu Đãi Đặc Biệt</p>
                                <h2>Ưu Đãi Mùa Hè — Cảm Hứng Cho Mọi Hành Trình</h2>
                            </div>
                        </div>
                    </div>

                    <div className="container">
                        <div className="row g-4 align-items-stretch">
                            <div className="col-lg-6">
                                <div className="banner-content z-1 rounded-3 banner-bg-1 text-white h-100">
                                    <p className="highlight-text">Tiết kiệm đến</p>
                                    <h4 className="fs-1 fw-semibold">50%</h4>
                                    <p className="pera fs-4 fw-bold">Khám Phá Đông Nam Á</p>
                                    <div className="location d-flex align-items-center gap-2">
                                        <i className="bi bi-geo-alt"></i>
                                        <p className="name mb-0">Băng Cốc, Thái Lan</p>
                                    </div>
                                    <button className="btn banner-btn px-4">Đặt Ngay</button>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="banner-content z-1 rounded-3 banner-bg-2 text-white h-100">
                                    <p className="highlight-text">Khách Sạn Gần Đây</p>
                                    <h4 className="fs-1 fw-semibold">Giảm 50%</h4>
                                    <p className="pera fs-4 fw-bold">Đặt Phòng Ngay Hôm Nay</p>
                                    <div className="location d-flex align-items-center gap-2">
                                        <i className="bi bi-geo-alt"></i>
                                        <p className="name mb-0">Đà Nẵng, Việt Nam</p>
                                    </div>
                                    <button className="btn banner-btn px-4">Đặt Ngay</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tours-container section">
                    <div className="container">
                        <div className="row text-center mb-5">
                            <div className="section-title d-flex align-items-center flex-column">
                                <p>Tour Nổi Bật</p>
                                <h2>Những Điểm Đến Được<br />Yêu Thích Nhất</h2>
                            </div>
                        </div>
                    </div>

                    <div className="container">
                        <div className="row">
                            <Swiper
                                slidesPerView={4}
                                spaceBetween={20}
                                breakpoints={{
                                    1399: { slidesPerView: 4 },
                                    1199: { slidesPerView: 3 },
                                    991: { slidesPerView: 2 },
                                    767: { slidesPerView: 1.5 },
                                    0: { slidesPerView: 1 },
                                }}
                                className="mt-4 swiper position-relative"
                            >
                                {tours.filter(tour => tour.id >= 19 && tour.id <= 25)
                                    .map((tour, idx) => {
                                        const featuredBadges = [
                                            { label: 'Hot',      cls: 'tour-badge-hot' },
                                            { label: 'Nổi Bật',  cls: 'tour-badge-bestseller' },
                                            { label: 'Ưu Đãi',   cls: 'tour-badge-sale' },
                                            { label: 'Mới',      cls: 'tour-badge-new' },
                                        ];
                                        const badge = featuredBadges[idx] || null;
                                        return (
                                        <SwiperSlide key={tour.id}>
                                            <div className="card h-100 tour-card shadow-sm position-relative">
                                                <div className="position-relative">
                                                   <Link to={`/TourDetails/${tour.id}`}>
                                                        <img src={tour.image} className="card-img-top rounded-3" alt={tour.title} />
                                                    </Link>
                                                    {badge && <span className={`tour-badge ${badge.cls}`}>{badge.label}</span>}
                                                    <i
                                                        className="ri-shopping-cart-2-line fs-5 text-white position-absolute top-0 end-0 m-2"
                                                        role="button"
                                                        onClick={() => handleBookNow(tour)}
                                                    ></i>
                                                </div>
                                                <div className="card-body py-3">
                                                    <h5 className="card-title fw-semibold mb-1">{tour.title}</h5>
                                                    <p className="mb-3"><i className="ri-map-pin-line me-1"></i>{tour.location}</p>
                                                    <div className="d-flex flex-wrap justify-content-between small mb-3 p-2 rounded-2" style={{ backgroundColor: "rgba(248,250,252,.08)" }}>
                                                        <div className="me-3"><i className="ri-time-line me-1"></i>{tour.duration}</div>
                                                        <div><i className="ri-user-line me-1"></i>{tour.persons}</div>
                                                    </div>
                                                    <div className="d-flex mt-2 align-items-center justify-content-between small">
                                                        <div className="fs-5" style={{ color: "#8f94a3" }}>
                                                            Từ
                                                            <span className="text-white fw-bold"> {formatVND(tour.price)}</span>
                                                        </div>
                                                        <div>
                                                            <i className="ri-star-fill text-warning me-1"></i>
                                                            <span>{tour.rating} ({tour.reviews})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                        );
                                    })}
                            </Swiper>
                        </div>
                    </div>
                </div>

                <div className="tours-container section tours-container-2 position-relative">
                    <div className="container">
                        <div className="row text-center mb-5">
                            <div className="section-title">
                                <p>Tour Phổ Biến</p>
                                <h2>Tour Được Đặt Nhiều Nhất<br />Trong Tháng</h2>
                            </div>
                        </div>
                    </div>

                    <div className="container">
                        <div className="row">
                            <Swiper
                                slidesPerView={4}
                                spaceBetween={20}
                                breakpoints={{
                                    1399: { slidesPerView: 4 },
                                    1199: { slidesPerView: 3 },
                                    991: { slidesPerView: 2 },
                                    767: { slidesPerView: 1.5 },
                                    0: { slidesPerView: 1 },
                                }}
                                className="mt-4 swiper position-relative"
                            >
                                {tours.filter(tour => tour.id >= 26 && tour.id <= 30)
                                    .map((tour, idx) => {
                                        const popularBadges = [
                                            { label: 'Hot',      cls: 'tour-badge-hot' },
                                            { label: 'Bestseller', cls: 'tour-badge-bestseller' },
                                            { label: 'Ưu Đãi',  cls: 'tour-badge-sale' },
                                        ];
                                        const badge = popularBadges[idx] || null;
                                        return (
                                        <SwiperSlide key={tour.id}>
                                             <div className="card h-100 tour-card shadow-sm position-relative">
                                                <div className="position-relative">
                                                    <Link to={`/TourDetails/${tour.id}`}>
                                                        <img src={tour.image} className="card-img-top rounded-3" alt={tour.title} />
                                                    </Link>
                                                    {badge && <span className={`tour-badge ${badge.cls}`}>{badge.label}</span>}
                                                    <i
                                                        className="ri-shopping-cart-2-line fs-5 text-white position-absolute top-0 end-0 m-2"
                                                        role="button"
                                                        onClick={() => handleBookNow(tour)}
                                                    ></i>
                                                </div>
                                                <div className="card-body py-3">
                                                    <h5 className="card-title fw-semibold mb-1">{tour.title}</h5>
                                                    <p className="mb-3"><i className="ri-map-pin-line me-1"></i>{tour.location}</p>
                                                    <div className="d-flex flex-wrap justify-content-between small mb-3 p-2 rounded-2" style={{ backgroundColor: "rgba(248,250,252,.08)" }}>
                                                        <div className="me-3"><i className="ri-time-line me-1"></i>{tour.duration}</div>
                                                        <div><i className="ri-user-line me-1"></i>{tour.persons}</div>
                                                    </div>
                                                    <div className="d-flex mt-2 align-items-center justify-content-between small">
                                                        <div className="fs-5" style={{ color: "#8f94a3" }}>
                                                            Từ
                                                            <span className="text-white fw-bold"> {formatVND(tour.price)}</span>
                                                        </div>
                                                        <div>
                                                            <i className="ri-star-fill text-warning me-1"></i>
                                                            <span>{tour.rating} ({tour.reviews})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                        );
                                    })}
                            </Swiper>
                        </div>
                    </div>
                </div>

                <div className="destination-container section">
                    <div className="container">
                        <div className="row text-center mb-5">
                            <div className="section-title">
                                <p>Điểm Đến Nổi Bật</p>
                                <h2>Khám Phá Những Nơi<br />Đẹp Nhất Thế Giới</h2>
                            </div>
                        </div>
                    </div>

                    <div className="container">
                        <div className="row">
                            {[
                                { src: destination1, name: 'Việt Nam',   place: 'Vịnh Hạ Long',   rating: '4.9' },
                                { src: destination2, name: 'Thái Lan',   place: 'Băng Cốc',        rating: '4.7' },
                                { src: destination3, name: 'Nhật Bản',   place: 'Tokyo',            rating: '4.8' },
                            ].map((d, i) => (
                                <div key={i} className="col-xl-4 col-lg-7 col-md-7 mb-4 mb-lg-2">
                                    <div className="destination-item w-100 rounded-3 text-white">
                                        <img src={d.src} alt="destination-image" />
                                        <div className="ratting-badge">
                                            <i className='ri-star-s-fill'></i>{d.rating}
                                        </div>
                                        <div className="destination-info p-4 w-100">
                                            <div className="destination-name">
                                                <p className='pera m-0 fs-2 fw-bold'>{d.name}</p>
                                                <div className="location d-flex gap-2">
                                                    <i className="ri-map-pin-line"></i>
                                                    <p className="name m-0">{d.place}</p>
                                                </div>
                                            </div>
                                            <div className="arrow-btn">
                                                <i className="ri-arrow-right-line fs-4"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="destination-gallery">
                                <div className="row mt-4">
                                    {[
                                        { src: destination4, name: 'Pháp',       place: 'Paris',        rating: '4.8' },
                                        { src: destination5, name: 'Singapore',  place: 'Marina Bay',   rating: '4.7' },
                                        { src: destination6, name: 'Hàn Quốc',  place: 'Seoul',        rating: '4.6' },
                                        { src: destination7, name: 'Ý',          place: 'Rome',         rating: '4.7' },
                                    ].map((d, i) => (
                                        <div key={i} className='col-lg-3 col-md-6 col-sm-6 mb-4'>
                                            <div className="destination-item w-100 rounded-3 text-white">
                                                <img src={d.src} alt="destination-image" />
                                                <div className="ratting-badge">
                                                    <i className='ri-star-s-fill'></i>{d.rating}
                                                </div>
                                                <div className="destination-info p-4 w-100">
                                                    <div className="destination-name">
                                                        <p className='pera m-0 fs-2 fw-bold'>{d.name}</p>
                                                        <div className="location d-flex gap-2">
                                                            <i className="ri-map-pin-line"></i>
                                                            <p className="name m-0">{d.place}</p>
                                                        </div>
                                                    </div>
                                                    <div className="arrow-btn">
                                                        <i className="ri-arrow-right-line fs-4"></i>
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

                <div className="explore-section section">
                    <div className="container">
                        <div className="row text-center">
                            <div className="section-title">
                                <p>Khám Phá Thế Giới</p>
                                <h2>Gói Du Lịch Tốt Nhất<br />Dành Cho Bạn</h2>
                            </div>
                        </div>

                        <div className="row g-4 mt-2">
                            {/* Tab list */}
                            <div className="col-lg-5">
                                <div className="exp-tab-list">
                                    {tabs.map((tab, index) => (
                                        <div
                                            key={index}
                                            className={`exp-tab-item${activeIndex === index ? ' active' : ''}`}
                                            onClick={() => setActiveIndex(index)}
                                        >
                                            <span className="exp-tab-num">{String(index + 1).padStart(2, '0')}</span>
                                            <i className={`${tab.icon} exp-tab-icon`}></i>
                                            <span className="exp-tab-title">{tab.title}</span>
                                            {activeIndex === index && <i className="ri-arrow-right-s-line exp-tab-arrow"></i>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Content card */}
                            <div className="col-lg-7">
                                <div className="exp-content">
                                    <div className="exp-img-wrap">
                                        <img src={tabs[activeIndex].exploreImg} alt={tabs[activeIndex].title} />
                                        <div className="exp-img-badge">
                                            <i className={tabs[activeIndex].icon}></i>
                                        </div>
                                    </div>
                                    <div className="exp-text">
                                        <h3 className="exp-title">{tabs[activeIndex].title}</h3>
                                        <p className="exp-desc">{tabs[activeIndex].desc}</p>
                                        <div className="exp-features">
                                            <div className="exp-feature">
                                                <i className="ri-shield-check-line"></i>
                                                <span>Hướng dẫn viên có chứng chỉ quốc tế</span>
                                            </div>
                                            <div className="exp-feature">
                                                <i className="ri-group-line"></i>
                                                <span>Nhóm nhỏ tối đa 12 người — trải nghiệm cá nhân hoá</span>
                                            </div>
                                        </div>
                                        <div className="exp-tags">
                                            <span className="exp-tag"><i className="ri-verified-badge-line"></i> An toàn</span>
                                            <span className="exp-tag"><i className="ri-star-line"></i> Chất lượng cao</span>
                                            <span className="exp-tag"><i className="ri-time-line"></i> Linh hoạt</span>
                                        </div>
                                        <Link to="/tours" className="exp-cta" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                            Khám phá ngay <i className="ri-arrow-right-line"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </>
    );
}

export default Index
