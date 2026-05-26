import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hotelJson from '../../Data/Hotel.json';
import { useAuth } from '../../Context/AuthContext';

/* ─── helpers ─────────────────────────────────────────────────── */
const formatVND = (n) => Math.round(n).toLocaleString('vi-VN') + ' ₫';

const getRoomImage = (roomName) => {
    const n = roomName.toLowerCase();
    if (n.includes('presidential') || n.includes('grand'))
        return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80';
    if (n.includes('suite') || n.includes('cao cấp') || n.includes('hanoian'))
        return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80';
    if (n.includes('villa') || n.includes('biệt thự'))
        return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80';
    if (n.includes('penthouse') || n.includes('duplex'))
        return 'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=800&q=80';
    if (n.includes('bungalow'))
        return 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&q=80';
    if (n.includes('studio'))
        return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80';
    if (n.includes('deluxe') || n.includes('prestige') || n.includes('panoramic'))
        return 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80';
    if (n.includes('sky') || n.includes('ocean') || n.includes('garden'))
        return 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=800&q=80';
    if (n.includes('standard'))
        return 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80';
    return 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80';
};

const amenityIcon = (a) => {
    const s = a.toLowerCase();
    if (s.includes('wi-fi') || s.includes('wifi'))    return 'ri-wifi-line';
    if (s.includes('bồn tắm'))                        return 'ri-bubble-chart-line';
    if (s.includes('hồ bơi'))                         return 'ri-swimming-fill';
    if (s.includes('điều hòa'))                       return 'ri-temp-cold-line';
    if (s.includes('tv') || s.includes('tivi'))       return 'ri-tv-2-line';
    if (s.includes('minibar') || s.includes('bar'))   return 'ri-goblet-line';
    if (s.includes('ban công') || s.includes('balcony')) return 'ri-building-line';
    if (s.includes('bếp') || s.includes('kitchen'))  return 'ri-restaurant-line';
    if (s.includes('bãi biển'))                       return 'ri-sailboat-line';
    if (s.includes('phòng khách'))                    return 'ri-sofa-line';
    return 'ri-checkbox-circle-line';
};

/* ─── Component ────────────────────────────────────────────────── */
const HotelRoomSelect = () => {
    const { id }          = useParams();
    const navigate        = useNavigate();
    const { currentUser } = useAuth();

    /* Load hotel */
    const allHotels = (() => {
        try {
            const stored = localStorage.getItem('admin_hotels');
            if (!stored) return hotelJson;
            const parsed = JSON.parse(stored);
            if (parsed.length > 0 && parsed[0].price < 10000) {
                localStorage.removeItem('admin_hotels'); return hotelJson;
            }
            return parsed;
        } catch { return hotelJson; }
    })();
    const hotel = allHotels.find(h => String(h.id) === id);

    /* Read booking metadata saved by HotelDetail */
    const meta = (() => {
        try { return JSON.parse(localStorage.getItem('bookingMeta') || '{}'); }
        catch { return {}; }
    })();

    const checkin    = meta.checkin    || '';
    const checkout   = meta.checkout   || '';
    const roomsCount = meta.rooms      || 1;
    const adults     = meta.adults     || 2;
    const children   = meta.children   || 0;

    const nights = (checkin && checkout)
        ? Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000))
        : 1;

    const [filter,      setFilter]      = useState('all');   // 'all' | 'available'
    const [sortBy,      setSortBy]      = useState('price'); // 'price' | 'size' | 'guests'
    const [selectedId,  setSelectedId]  = useState(null);
    const [imgError,    setImgError]    = useState({});
    const [booking,     setBooking]     = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    if (!hotel) {
        return (
            <div className="container py-5 text-center">
                <h4 style={{ color: '#fff' }}>Không tìm thấy khách sạn.</h4>
                <button className="lp-btn mt-3" onClick={() => navigate('/hotels')}>Quay lại</button>
            </div>
        );
    }

    /* Filter + sort rooms */
    let rooms = [...(hotel.rooms || [])];
    if (filter === 'available') rooms = rooms.filter(r => r.available);
    if (sortBy === 'price')     rooms.sort((a, b) => a.price - b.price);
    if (sortBy === 'size')      rooms.sort((a, b) => b.size - a.size);
    if (sortBy === 'guests')    rooms.sort((a, b) => b.maxGuests - a.maxGuests);

    const formatDate = (d) => {
        if (!d) return '—';
        const dt = new Date(d);
        return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const guestLabel = [
        `${adults} người lớn`,
        children > 0 ? `${children} trẻ em` : null,
        `${roomsCount} phòng`,
    ].filter(Boolean).join(' · ');

    /* When user clicks "Chọn phòng này" */
    const handleSelectRoom = (room) => {
        if (!room.available) return;
        if (!currentUser) { navigate('/signin'); return; }

        setSelectedId(room.id);
        setBooking(true);

        const pricePerNight = room.price;
        const subTotal      = pricePerNight * nights * roomsCount;
        const tax           = Math.round(subTotal * 0.1);
        const total         = subTotal + tax;

        localStorage.setItem('bookingItem', JSON.stringify({
            /* hotel info */
            id:          hotel.id,
            serviceId:   `hotel-${hotel.id}`,
            title:       hotel.name,
            image:       hotel.image,
            location:    hotel.location || 'Điểm đến đã chọn',
            /* room info */
            roomId:      room.id,
            roomName:    room.name,
            itemName:    `${hotel.name} – ${room.name}`,
            /* booking details */
            date:        checkin  || null,
            checkOut:    checkout || null,
            nights,
            roomsCount,
            adults,
            children,
            /* pricing */
            pricePerNight,
            subTotal,
            tax,
            price:       total,
            quantity:    1,
        }));

        setTimeout(() => navigate('/checkout'), 300);
    };

    return (
        <div className="hrs-page">
            {/* ── Booking summary bar ── */}
            <div className="hrs-summary-bar">
                <div className="container">
                    <div className="hrs-summary-inner">
                        <div className="hrs-summary-hotel">
                            <img
                                src={hotel.image}
                                alt={hotel.name}
                                className="hrs-summary-img"
                                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=80&q=60'; }}
                            />
                            <div>
                                <div className="hrs-summary-name">{hotel.name}</div>
                                <div className="hrs-summary-loc">
                                    <i className="ri-map-pin-2-fill"></i> {hotel.location}
                                </div>
                            </div>
                        </div>

                        <div className="hrs-summary-info">
                            <div className="hrs-summary-item">
                                <i className="ri-calendar-check-line"></i>
                                <div>
                                    <div className="hrs-si-label">Nhận phòng</div>
                                    <div className="hrs-si-val">{formatDate(checkin)}</div>
                                </div>
                            </div>
                            <div className="hrs-summary-arrow"><i className="ri-arrow-right-line"></i></div>
                            <div className="hrs-summary-item">
                                <i className="ri-calendar-2-line"></i>
                                <div>
                                    <div className="hrs-si-label">Trả phòng</div>
                                    <div className="hrs-si-val">{formatDate(checkout)}</div>
                                </div>
                            </div>
                            <div className="hrs-summary-sep"></div>
                            <div className="hrs-summary-item">
                                <i className="ri-moon-line"></i>
                                <div>
                                    <div className="hrs-si-label">Số đêm</div>
                                    <div className="hrs-si-val">{nights} đêm</div>
                                </div>
                            </div>
                            <div className="hrs-summary-sep"></div>
                            <div className="hrs-summary-item">
                                <i className="ri-group-line"></i>
                                <div>
                                    <div className="hrs-si-label">Khách &amp; Phòng</div>
                                    <div className="hrs-si-val">{guestLabel}</div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="hrs-change-btn"
                            onClick={() => navigate(`/hotels/${id}`)}
                        >
                            <i className="ri-edit-2-line"></i> Thay đổi
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="container hrs-main">

                {/* Breadcrumb */}
                <nav className="td-breadcrumb mb-3">
                    <span className="td-crumb" onClick={() => navigate('/')}>Trang chủ</span>
                    <i className="ri-arrow-right-s-line"></i>
                    <span className="td-crumb" onClick={() => navigate('/hotels')}>Khách sạn</span>
                    <i className="ri-arrow-right-s-line"></i>
                    <span className="td-crumb" onClick={() => navigate(`/hotels/${id}`)}>{hotel.name}</span>
                    <i className="ri-arrow-right-s-line"></i>
                    <span className="td-crumb active">Chọn phòng</span>
                </nav>

                {/* Section header + filter/sort bar */}
                <div className="hrs-toolbar">
                    <div className="hrs-toolbar-left">
                        <h2 className="hrs-heading">
                            <i className="ri-hotel-bed-line"></i>
                            Chọn loại phòng
                            <span className="hrs-count-badge">{hotel.rooms?.length || 0} loại</span>
                        </h2>
                    </div>

                    <div className="hrs-toolbar-right">
                        <div className="hrs-filter-group">
                            <label className="hrs-filter-label"><i className="ri-filter-3-line"></i></label>
                            <button
                                className={`hrs-filter-btn${filter === 'all' ? ' active' : ''}`}
                                onClick={() => setFilter('all')}
                            >Tất cả</button>
                            <button
                                className={`hrs-filter-btn${filter === 'available' ? ' active' : ''}`}
                                onClick={() => setFilter('available')}
                            >Còn phòng</button>
                        </div>

                        <div className="hrs-sort-group">
                            <label className="hrs-filter-label"><i className="ri-sort-asc"></i></label>
                            <select
                                className="hrs-sort-select"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="price">Giá tăng dần</option>
                                <option value="size">Diện tích</option>
                                <option value="guests">Sức chứa</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Room cards */}
                <div className="hrs-room-list">
                    {rooms.length === 0 ? (
                        <div className="hrs-empty">
                            <i className="ri-hotel-bed-line"></i>
                            <p>Không có phòng nào phù hợp.</p>
                        </div>
                    ) : rooms.map(room => {
                        const imgSrc    = imgError[room.id] ? hotel.image : getRoomImage(room.name);
                        const nightTotal = room.price * nights * roomsCount;
                        const isSelected = selectedId === room.id;

                        return (
                            <div
                                key={room.id}
                                className={`hrs-room-card${!room.available ? ' hrs-unavail' : ''}${isSelected ? ' hrs-selected' : ''}`}
                            >
                                {/* Image */}
                                <div className="hrs-room-img-wrap">
                                    <img
                                        src={imgSrc}
                                        alt={room.name}
                                        className="hrs-room-img"
                                        onError={() => setImgError(prev => ({ ...prev, [room.id]: true }))}
                                    />
                                    {!room.available && (
                                        <div className="hrs-sold-overlay">
                                            <i className="ri-close-circle-fill"></i>
                                            <span>Hết phòng</span>
                                        </div>
                                    )}
                                    {room.available && (
                                        <div className="hrs-avail-badge">
                                            <i className="ri-checkbox-circle-fill"></i> Còn phòng
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="hrs-room-details">
                                    <div className="hrs-room-details-top">
                                        <div>
                                            <h3 className="hrs-room-name">{room.name}</h3>
                                            <div className="hrs-room-specs">
                                                <span className="hrs-spec">
                                                    <i className="ri-hotel-bed-line"></i> {room.beds}
                                                </span>
                                                <span className="hrs-spec">
                                                    <i className="ri-user-line"></i> Tối đa {room.maxGuests} khách
                                                </span>
                                                <span className="hrs-spec">
                                                    <i className="ri-expand-left-right-line"></i> {room.size} m²
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amenities */}
                                    <div className="hrs-amenities">
                                        {room.amenities.map((a, i) => (
                                            <span key={i} className="hrs-amenity">
                                                <i className={amenityIcon(a)}></i> {a}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Policies row */}
                                    <div className="hrs-policies">
                                        <span className="hrs-policy green">
                                            <i className="ri-check-line"></i> Hủy miễn phí trước 48h
                                        </span>
                                        <span className="hrs-policy blue">
                                            <i className="ri-restaurant-line"></i> Bao gồm bữa sáng
                                        </span>
                                        <span className="hrs-policy yellow">
                                            <i className="ri-shield-check-line"></i> Đảm bảo giá tốt nhất
                                        </span>
                                    </div>
                                </div>

                                {/* Price + CTA */}
                                <div className="hrs-room-cta">
                                    <div className="hrs-price-block">
                                        <div className="hrs-price-night">
                                            <span className="hrs-price-num">{formatVND(room.price)}</span>
                                            <span className="hrs-price-unit">/đêm</span>
                                        </div>
                                        {nights > 1 && (
                                            <div className="hrs-price-total">
                                                {formatVND(nightTotal)}
                                                <span className="hrs-price-total-label">
                                                    &nbsp;· {nights} đêm · {roomsCount} phòng
                                                </span>
                                            </div>
                                        )}
                                        <div className="hrs-price-tax">
                                            Chưa gồm thuế 10%
                                        </div>
                                    </div>

                                    {room.available ? (
                                        <button
                                            className={`hrs-select-btn${isSelected && booking ? ' hrs-selecting' : ''}`}
                                            onClick={() => handleSelectRoom(room)}
                                            disabled={isSelected && booking}
                                        >
                                            {isSelected && booking ? (
                                                <>
                                                    <i className="ri-loader-4-line ri-spin"></i> Đang chuyển...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-calendar-check-line"></i> Chọn phòng này
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button className="hrs-select-btn hrs-disabled" disabled>
                                            <i className="ri-close-circle-line"></i> Hết phòng
                                        </button>
                                    )}

                                    <div className="hrs-cta-note">
                                        <i className="ri-lock-line"></i> Thanh toán an toàn
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom note */}
                <div className="hrs-bottom-note">
                    <i className="ri-information-line"></i>
                    Giá hiển thị chưa bao gồm thuế VAT 10%. Chính sách hủy phòng miễn phí áp dụng khi hủy trước 48 giờ nhận phòng.
                </div>
            </div>
        </div>
    );
};

export default HotelRoomSelect;
