import React, { useState } from 'react';

const SUBJECTS = [
    "Tư vấn tour du lịch",
    "Đặt khách sạn / phòng nghỉ",
    "Thuê xe / phương tiện di chuyển",
    "Góp ý & khiếu nại",
    "Hợp tác & đối tác",
    "Vấn đề khác",
];

const ContactSection = () => {
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <div className="contact-section main-wrapper">

            {/* ── Tiêu đề ───────────────────────────────── */}
            <div className="container mb-5">
                <div className="section-title text-center">
                    <p>Liên Hệ</p>
                    <h2 className="text-white">Chúng Tôi Luôn Sẵn Sàng Giúp Bạn</h2>
                    <p className="ct-subtitle">Có thắc mắc về tour, dịch vụ hay cần hỗ trợ đặt chỗ? Hãy liên hệ — đội ngũ DAYTRIP phản hồi trong vòng 30 phút.</p>
                </div>
            </div>

            {/* ── Thẻ thông tin liên hệ ─────────────────── */}
            <div className="container mb-5">
                <div className="row g-4">
                    <div className="col-md-3 col-sm-6">
                        <div className="ct-info-card">
                            <div className="ct-info-icon">
                                <i className="ri-phone-line"></i>
                            </div>
                            <h6>Điện Thoại</h6>
                            <p>+84 (028) 3822 0000</p>
                            <p>+84 (090) 123 4567</p>
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <div className="ct-info-card">
                            <div className="ct-info-icon">
                                <i className="ri-mail-line"></i>
                            </div>
                            <h6>Email</h6>
                            <p>support@daytrip.vn</p>
                            <p>booking@daytrip.vn</p>
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <div className="ct-info-card">
                            <div className="ct-info-icon">
                                <i className="ri-map-pin-line"></i>
                            </div>
                            <h6>Địa Chỉ</h6>
                            <p></p>
                            <p>TP. Hà Nội</p>
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <div className="ct-info-card">
                            <div className="ct-info-icon">
                                <i className="ri-time-line"></i>
                            </div>
                            <h6>Giờ Làm Việc</h6>
                            <p>Thứ 2 – Thứ 6: 8:00 – 18:00</p>
                            <p>Thứ 7 – CN: 9:00 – 16:00</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Form liên hệ ──────────────────────────── */}
            <div className="container mb-5">
                <div className="row justify-content-center">
                    <div className="col-xl-8 col-lg-10">
                        <div className="contact-card">
                            <h4 className="contact-heading">Gửi Tin Nhắn Cho Chúng Tôi</h4>
                            <p className="ct-form-note">Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại với bạn sớm nhất có thể.</p>
                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="row g-4">
                                    <div className="col-sm-6">
                                        <label className="ct-label">Họ và tên</label>
                                        <input
                                            className="form-control custom-input"
                                            type="text"
                                            placeholder="Nguyễn Văn A"
                                            required
                                        />
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="ct-label">Email</label>
                                        <input
                                            className="form-control custom-input"
                                            type="email"
                                            placeholder="email@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="ct-label">Số điện thoại</label>
                                        <input
                                            className="form-control custom-input"
                                            type="tel"
                                            placeholder="0901 234 567"
                                        />
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="ct-label">Chủ đề</label>
                                        <select className="form-control custom-input" defaultValue="">
                                            <option value="" disabled>Chọn chủ đề...</option>
                                            {SUBJECTS.map((s, i) => (
                                                <option key={i} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-sm-12">
                                        <label className="ct-label">Nội dung</label>
                                        <textarea
                                            className="form-control custom-textarea"
                                            rows="5"
                                            placeholder="Mô tả yêu cầu hoặc câu hỏi của bạn..."
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="mt-4 d-flex align-items-center gap-3 flex-wrap">
                                    <button type="submit" className="btn send-btn">
                                        <i className="ri-send-plane-line me-2"></i>Gửi Tin Nhắn
                                    </button>
                                    {sent && (
                                        <span className="ct-success-msg">
                                            <i className="ri-check-line me-1"></i>Đã gửi thành công! Chúng tôi sẽ phản hồi sớm.
                                        </span>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bản đồ ────────────────────────────────── */}
            <div className="map-container">
                <div className="ct-map-label container mb-2">
                    <i className="ri-map-pin-2-line me-2" style={{ color: "var(--secondary-color)" }}></i>
                    <span className="text-white">Văn phòng DAYTRIP — TP. Hà Nội</span>
                </div>
                <iframe
                    title="Bản đồ DAYTRIP"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4536679122474!2d106.70101937480837!3d10.775659089384374!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3a9d8d827b%3A0xd0116b5d36a62e42!2zTmd1eeG7hW4gSHXhu4csIFF14bahaiBIb8OgbiBLaeG6v20sIFRow6BuaCBwaOG7kSBIw7MgQ2jDrSBNaW5o!5e0!3m2!1svi!2svn!4v1714900000000!5m2!1svi!2svn"
                    className="map-frame"
                    allowFullScreen=""
                    loading="lazy"
                ></iframe>
            </div>
        </div>
    );
};

export default ContactSection;
