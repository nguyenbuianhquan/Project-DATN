import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hotelJson from '../../../src/Data/Hotel.json';
import { useAuth } from '../../Context/AuthContext';

const formatVND = (vnd) => Math.round(vnd).toLocaleString('vi-VN') + ' ₫';

const getRoomImage = (roomName) => {
    const n = roomName.toLowerCase();
    if (n.includes('presidential') || n.includes('grand'))
        return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80';
    if (n.includes('suite') || n.includes('hanoian'))
        return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80';
    if (n.includes('villa') || n.includes('biệt thự'))
        return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80';
    if (n.includes('penthouse') || n.includes('duplex'))
        return 'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=600&q=80';
    if (n.includes('bungalow'))
        return 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&q=80';
    if (n.includes('studio'))
        return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80';
    if (n.includes('deluxe') || n.includes('prestige') || n.includes('panoramic'))
        return 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80';
    if (n.includes('sky') || n.includes('ocean') || n.includes('garden'))
        return 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=600&q=80';
    return 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80';
};

const TABS = [
    { label: 'Tổng quan',  icon: 'information'  },
    { label: 'Vị trí',     icon: 'map-pin-2'    },
    { label: 'Các phòng',  icon: 'hotel-bed'    },
    { label: 'Đánh giá',   icon: 'star'         },
    { label: 'Bảng giá',   icon: 'price-tag-3'  },
];

const StarRow = ({ rating }) => (
    <span className="td-star-row">
        {[1, 2, 3, 4, 5].map(s => (
            <i key={s} className={`ri-star-${s <= Math.round(rating) ? 'fill' : 'line'}`}></i>
        ))}
    </span>
);

const HotelDetail = () => {
    const { id }          = useParams();
    const navigate        = useNavigate();
    const { currentUser } = useAuth();

    const allHotels = (() => {
        const stored = localStorage.getItem('admin_hotels');
        if (!stored) return hotelJson;
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && parsed[0].price < 10000) { localStorage.removeItem('admin_hotels'); return hotelJson; }
        return parsed;
    })();
    const hotel = allHotels.find(h => String(h.id) === id);

    const [activeTab,       setActiveTab]       = useState('Tổng quan');
    const [rooms,           setRooms]           = useState(1);
    const [adults,          setAdults]          = useState(2);
    const [children,        setChildren]        = useState(0);
    const [checkin,         setCheckin]         = useState('');
    const [checkout,        setCheckout]        = useState('');
    const [selectedRoom,    setSelectedRoom]    = useState(null);
    const [showGuestPicker, setShowGuestPicker] = useState(false);
    const [lightboxSrc,     setLightboxSrc]     = useState(null);
    const guestPickerRef = useRef(null);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        const handler = (e) => {
            if (guestPickerRef.current && !guestPickerRef.current.contains(e.target))
                setShowGuestPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!hotel) {
        return (
            <div className="container py-5 text-center">
                <h4 style={{ color: '#fff' }}>Không tìm thấy khách sạn.</h4>
                <button className="lp-btn mt-3" onClick={() => navigate('/hotels')}>Quay lại</button>
            </div>
        );
    }

    const galleryImgs = Array(5).fill(hotel.image);
    const nights    = (checkin && checkout)
        ? Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000))
        : 1;
    const baseRoom  = selectedRoom || (hotel.rooms && hotel.rooms.find(r => r.available)) || null;
    const basePrice = baseRoom ? baseRoom.price : hotel.price;
    const total     = basePrice * nights * rooms;
    const mapQuery  = encodeURIComponent(hotel.name + ', ' + hotel.location);
    const guestLabel = [
        `${adults} người lớn`,
        children > 0 ? `${children} trẻ em` : null,
        `${rooms} phòng`,
    ].filter(Boolean).join(' · ');

    const handleBook = () => {
        if (!currentUser) { navigate('/signin'); return; }
        localStorage.setItem('bookingItem', JSON.stringify({
            id:       hotel.id,
            title:    hotel.name,
            image:    hotel.image,
            price:    Math.round(total * 1.1),
            quantity: 1,
            location: hotel.location || 'Điểm đến đã chọn',
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
                        <span className="td-crumb" onClick={() => navigate('/hotels')}>Khách sạn</span>
                        <i className="ri-arrow-right-s-line"></i>
                        <span className="td-crumb active">{hotel.name}</span>
                    </nav>

                    <div className="d-flex align-items-center gap-2 mb-2">
                        {hotel.type && <span className="detail-type-badge">{hotel.type}</span>}
                        {hotel.featured && <span className="td-page-tag" style={{ marginBottom: 0 }}>Nổi bật</span>}
                    </div>

                    <h1 className="td-page-title">{hotel.name}</h1>

                    <div className="td-meta-row">
                        <span className="td-meta-rating">
                            <i className="ri-star-fill"></i> {hotel.rating}
                        </span>
                        <span className="td-meta-reviews">({hotel.reviews} đánh giá)</span>
                        <span className="td-meta-sep">·</span>
                        <span className="td-meta-item">
                            <i className="ri-map-pin-2-fill"></i> {hotel.location}
                        </span>
                        {hotel.type && (
                            <>
                                <span className="td-meta-sep">·</span>
                                <span className="td-meta-item">
                                    <i className="ri-building-line"></i> {hotel.type}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Gallery ── */}
            <div className="td-gallery-section">
                <div className="container">
                    <div className="td-gallery-grid">
                        <div className="td-gallery-main" onClick={() => setLightboxSrc(galleryImgs[0])}>
                            <img src={galleryImgs[0]} alt={hotel.name} className="td-gallery-img" />
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
                        <div className="col-lg-8">

                            {/* ── Tổng quan ── */}
                            {activeTab === 'Tổng quan' && (
                                <div className="d-flex flex-column gap-4">
                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-file-text-line"></i> Giới thiệu</h5>
                                        <p className="td-para">{hotel.description}</p>
                                        <p className="td-para">
                                            Chúng tôi cung cấp trải nghiệm lưu trú đẳng cấp với không gian sang trọng, dịch vụ tận tâm và vị trí thuận tiện. Mỗi phòng được thiết kế tinh tế, đảm bảo sự thoải mái và riêng tư tối đa cho quý khách.
                                        </p>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-star-line"></i> Tiện nghi nổi bật</h5>
                                        <div className="row g-2">
                                            {hotel.facilities.map((fac, idx) => (
                                                <div className="col-6 col-md-4" key={idx}>
                                                    <div className="detail-facility-item">
                                                        <i className={`ri-${fac.icon}-line`} style={{ color: '#f6c948' }}></i>
                                                        <span>{fac.name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {hotel.rooms && hotel.rooms.some(r => r.image) && (
                                        <section className="td-section">
                                            <h5 className="td-section-title"><i className="ri-image-line"></i> Hình ảnh các phòng</h5>
                                            <div className="row g-2 mt-1">
                                                {hotel.rooms.map(room => (
                                                    <div className="col-6 col-md-3" key={room.id}>
                                                        <div className="room-thumb-wrap" onClick={() => setLightboxSrc(getRoomImage(room.name))}>
                                                            <img src={getRoomImage(room.name)} alt={room.name} className="room-thumb-img"
                                                                onError={e => { e.target.src = hotel.image; }} />
                                                            <div className="room-thumb-label">{room.name}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-list-check-3"></i> Dịch vụ bao gồm</h5>
                                        <div className="td-include-grid">
                                            <div className="td-include-card td-include-yes">
                                                <div className="td-include-head"><i className="ri-checkbox-circle-fill"></i> Bao gồm</div>
                                                <ul className="td-include-list">
                                                    <li><i className="ri-check-line"></i>Bữa sáng miễn phí</li>
                                                    <li><i className="ri-check-line"></i>Wi-Fi tốc độ cao</li>
                                                    <li><i className="ri-check-line"></i>Dọn phòng hằng ngày</li>
                                                    <li><i className="ri-check-line"></i>Đưa đón sân bay</li>
                                                </ul>
                                            </div>
                                            <div className="td-include-card td-include-no">
                                                <div className="td-include-head"><i className="ri-close-circle-fill"></i> Không bao gồm</div>
                                                <ul className="td-include-list">
                                                    <li><i className="ri-close-line"></i>Chi phí cá nhân</li>
                                                    <li><i className="ri-close-line"></i>Dịch vụ giặt ủi</li>
                                                    <li><i className="ri-close-line"></i>Đồ ăn thêm ngoài giờ</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="td-section">
                                        <h5 className="td-section-title"><i className="ri-shield-check-line"></i> Chính sách hủy phòng</h5>
                                        <div className="td-cancel-list">
                                            {[
                                                { color: 'green',  title: 'Hủy trước 48 giờ',      desc: 'Hoàn tiền 100%' },
                                                { color: 'yellow', title: 'Hủy trong 24–48 giờ',    desc: 'Hoàn tiền 50%'  },
                                                { color: 'red',    title: 'Hủy trong vòng 24 giờ',  desc: 'Không hoàn tiền' },
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

                            {/* ── Vị trí ── */}
                            {activeTab === 'Vị trí' && (
                                <section className="td-section">
                                    <h5 className="td-section-title"><i className="ri-map-2-line"></i> Vị trí trên bản đồ</h5>
                                    <div className="td-map-wrap mt-2">
                                        <iframe title="Bản đồ vị trí"
                                            src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&z=15`}
                                            width="100%" height="320"
                                            style={{ border: 0, borderRadius: 12, display: 'block' }}
                                            allowFullScreen="" loading="lazy" />
                                    </div>
                                    <div className="row g-3 mt-2">
                                        {[
                                            { icon: 'flight-takeoff', label: 'Sân bay gần nhất',    value: '12 km' },
                                            { icon: 'train',          label: 'Ga tàu',               value: '3.5 km' },
                                            { icon: 'store',          label: 'Trung tâm mua sắm',    value: '1.2 km' },
                                            { icon: 'hospital',       label: 'Bệnh viện',            value: '2.8 km' },
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

                            {/* ── Các phòng ── */}
                            {activeTab === 'Các phòng' && (
                                <div className="d-flex flex-column gap-3">
                                    <h5 className="td-section-title" style={{ paddingLeft: 0 }}>
                                        <i className="ri-hotel-bed-line" style={{ color: 'var(--secondary-color)' }}></i> Chọn loại phòng
                                    </h5>
                                    {hotel.rooms && hotel.rooms.length > 0 ? hotel.rooms.map(room => (
                                        <div key={room.id}
                                            className={`room-card${selectedRoom?.id === room.id ? ' selected' : ''}${!room.available ? ' unavailable' : ''}`}
                                            onClick={() => room.available && setSelectedRoom(prev => prev?.id === room.id ? null : room)}
                                        >
                                            <div className="room-card-img-header"
                                                onClick={e => { e.stopPropagation(); setLightboxSrc(getRoomImage(room.name)); }}>
                                                <img src={getRoomImage(room.name)} alt={room.name}
                                                    onError={e => { e.target.src = hotel.image; }} />
                                                {!room.available && <div className="room-card-sold-overlay">Hết phòng</div>}
                                            </div>
                                            <div className="room-card-body">
                                                <div className="room-card-top">
                                                    <div>
                                                        <div className="room-card-name">{room.name}</div>
                                                        <div className="room-card-specs">
                                                            <span><i className="ri-hotel-bed-line"></i> {room.beds}</span>
                                                            <span><i className="ri-user-line"></i> Tối đa {room.maxGuests} khách</span>
                                                            <span><i className="ri-expand-left-right-line"></i> {room.size} m²</span>
                                                        </div>
                                                        <div className="room-card-amenities">
                                                            {room.amenities.map((a, i) => <span key={i} className="room-amenity-tag">{a}</span>)}
                                                        </div>
                                                    </div>
                                                    <div className="room-card-right">
                                                        <div className="room-card-price">{formatVND(room.price)}</div>
                                                        <div className="room-card-price-label">/đêm</div>
                                                        <span className={`room-avail-badge ${room.available ? 'ok' : 'no'}`}>
                                                            {room.available ? 'Còn phòng' : 'Hết phòng'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedRoom?.id === room.id && (
                                                    <div className="room-selected-indicator">
                                                        <span><i className="ri-checkbox-circle-fill"></i> Đã chọn phòng này</span>
                                                        <button className="room-deselect-btn"
                                                            onClick={e => { e.stopPropagation(); setSelectedRoom(null); }}>
                                                            <i className="ri-close-line"></i> Bỏ chọn
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Không có thông tin phòng.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Đánh giá ── */}
                            {activeTab === 'Đánh giá' && (
                                <div className="d-flex flex-column gap-4">
                                    <div className="td-rating-summary">
                                        <div className="td-rating-score">{hotel.rating}</div>
                                        <div className="td-rating-detail">
                                            <StarRow rating={hotel.rating} />
                                            <div className="td-rating-label">
                                                {hotel.rating >= 4.8 ? 'Xuất sắc' : hotel.rating >= 4.5 ? 'Tuyệt vời' : hotel.rating >= 4.0 ? 'Rất tốt' : 'Tốt'}
                                            </div>
                                            <div className="td-rating-count">Dựa trên {hotel.reviews} đánh giá</div>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        {hotel.userReviews && hotel.userReviews.map(rev => (
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
                                    <h5 className="td-section-title"><i className="ri-price-tag-3-line"></i> Bảng giá các loại phòng</h5>
                                    <div className="price-table-wrap mt-3">
                                        <table className="price-table">
                                            <thead>
                                                <tr>
                                                    <th>Loại phòng</th>
                                                    <th>Sức chứa</th>
                                                    <th>Diện tích</th>
                                                    <th>Giá/đêm (VNĐ)</th>
                                                    <th>Tình trạng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {hotel.rooms && hotel.rooms.map(room => (
                                                    <tr key={room.id} className={!room.available ? 'price-row-unavail' : ''}>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: '#fff' }}>{room.name}</div>
                                                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{room.beds}</div>
                                                        </td>
                                                        <td>{room.maxGuests} khách</td>
                                                        <td>{room.size} m²</td>
                                                        <td><span className="price-table-vnd">{formatVND(room.price)}</span></td>
                                                        <td>
                                                            <span className={`room-avail-badge ${room.available ? 'ok' : 'no'}`}>
                                                                {room.available ? 'Còn phòng' : 'Hết phòng'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="price-note-box mt-3">
                                        <i className="ri-information-line"></i>
                                        Giá đã bao gồm bữa sáng. Thuế VAT 10% chưa bao gồm. Giá có thể thay đổi theo mùa.
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
                                            <div className="td-bk-price">{formatVND(basePrice)}</div>
                                            <div className="td-bk-unit">/đêm · chưa gồm thuế</div>
                                        </div>
                                        <div className="td-bk-verified">
                                            <i className="ri-shield-check-fill"></i>
                                            <span>Đã xác thực</span>
                                        </div>
                                    </div>

                                    <div className="td-bk-body">
                                        {selectedRoom && (
                                            <div className="selected-room-chip mb-3">
                                                <i className="ri-hotel-bed-line me-1"></i> {selectedRoom.name}
                                            </div>
                                        )}

                                        {/* Check-in / Check-out cạnh nhau */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-calendar-2-line"></i> Ngày lưu trú
                                            </label>
                                            <div className="td-date-row">
                                                <div className="td-date-half">
                                                    <div className="td-date-sublabel">Nhận phòng</div>
                                                    <input type="date" className="td-bk-input"
                                                        value={checkin} onChange={e => setCheckin(e.target.value)} />
                                                </div>
                                                <div className="td-date-sep"><i className="ri-arrow-right-line"></i></div>
                                                <div className="td-date-half">
                                                    <div className="td-date-sublabel">Trả phòng</div>
                                                    <input type="date" className="td-bk-input"
                                                        value={checkout} onChange={e => setCheckout(e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Khách & Phòng – guest picker popup */}
                                        <div className="td-bk-field">
                                            <label className="td-bk-label">
                                                <i className="ri-user-3-line"></i> Khách &amp; Phòng
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
                                                        {/* Phòng */}
                                                        <div className="td-gp-row">
                                                            <div className="td-gp-info">
                                                                <div className="td-gp-label">Số phòng</div>
                                                                <div className="td-gp-note">Tối đa 5 phòng</div>
                                                            </div>
                                                            <div className="td-gp-ctrl">
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setRooms(Math.max(1, rooms - 1))} disabled={rooms <= 1}>
                                                                    <i className="ri-subtract-line"></i>
                                                                </button>
                                                                <span className="td-gp-count">{rooms}</span>
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setRooms(Math.min(5, rooms + 1))} disabled={rooms >= 5}>
                                                                    <i className="ri-add-line"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Người lớn */}
                                                        <div className="td-gp-row">
                                                            <div className="td-gp-info">
                                                                <div className="td-gp-label">Người lớn</div>
                                                                <div className="td-gp-note">Từ 18 tuổi</div>
                                                            </div>
                                                            <div className="td-gp-ctrl">
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}>
                                                                    <i className="ri-subtract-line"></i>
                                                                </button>
                                                                <span className="td-gp-count">{adults}</span>
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setAdults(Math.min(rooms * 4, adults + 1))} disabled={adults >= rooms * 4}>
                                                                    <i className="ri-add-line"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Trẻ em */}
                                                        <div className="td-gp-row">
                                                            <div className="td-gp-info">
                                                                <div className="td-gp-label">Trẻ em</div>
                                                                <div className="td-gp-note">0 – 17 tuổi</div>
                                                            </div>
                                                            <div className="td-gp-ctrl">
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0}>
                                                                    <i className="ri-subtract-line"></i>
                                                                </button>
                                                                <span className="td-gp-count">{children}</span>
                                                                <button type="button" className="td-guest-btn"
                                                                    onClick={() => setChildren(Math.min(rooms * 3, children + 1))} disabled={children >= rooms * 3}>
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

                                        <div className="td-breakdown">
                                            <div className="td-breakdown-row">
                                                <span>{formatVND(basePrice)} × {nights} đêm × {rooms} phòng</span>
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
                                            <i className="ri-calendar-check-line"></i> Đặt ngay
                                        </button>

                                        <div className="td-bk-guarantees">
                                            <div className="td-bk-guarantee-item">
                                                <i className="ri-check-double-line"></i>
                                                <span>Hủy miễn phí trước 48 giờ nhận phòng</span>
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

export default HotelDetail;
