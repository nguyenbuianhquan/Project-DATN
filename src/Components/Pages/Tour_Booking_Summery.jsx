import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import InvoiceDocument from './InvoiceDocument';

const StepBar = () => {
    const steps = ["Thông tin", "Thanh toán", "Hoàn tất"];
    return (
        <div className="cp-steps">
            {steps.map((label, i) => {
                const n = i + 1;
                return (
                    <React.Fragment key={n}>
                        <div className="cp-step cp-step-done">
                            <div className="cp-step-circle">
                                <i className="bi bi-check-lg"></i>
                            </div>
                            <span className="cp-step-label">{label}</span>
                        </div>
                        {i < steps.length - 1 && <div className="cp-step-line cp-step-line-done" />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const fmtVND = (n) => Math.round(n).toLocaleString('vi-VN') + ' ₫';

const BookingConfirmation = () => {
    const { state } = useLocation();

    const {
        date          = 'Chưa xác định',
        checkOut      = '',
        location      = 'Điểm đến đã chọn',
        adults        = 0,
        children      = 0,
        tourGuide     = 0,
        dinner        = 0,
        tax           = 0,
        subTotal      = 0,
        total         = 0,
        transport     = { title: '', cost: 0 },
        restaurant    = { title: '', cost: 0 },
        hotel         = { title: '', cost: 0 },
        customerName  = '',
        customerEmail = '',
        showInvoiceButton = true,
    } = state || {};

    const handleDownloadInvoice = async () => {
        const blob = await pdf(
            <InvoiceDocument data={{
                date, checkOut, location, adults, children,
                tourGuide, dinner, tax, subTotal, total,
                transport, restaurant, hotel,
                customerName, customerEmail,
            }} />
        ).toBlob();
        saveAs(blob, `DAYTRIP-invoice-${Date.now()}.pdf`);
    };

    const rows = [
        { icon: "bi-geo-alt-fill",   label: "Điểm đến",      value: location,                                   accent: true },
        { icon: "bi-calendar3",      label: "Ngày khởi hành", value: date },
        { icon: "bi-people-fill",    label: "Người lớn",      value: adults.toString().padStart(2, '0') },
        { icon: "bi-person-fill",    label: "Trẻ em",         value: children.toString().padStart(2, '0') },
        { icon: "bi-person-badge",   label: "Hướng dẫn viên", value: fmtVND(tourGuide) },
        { icon: "bi-cup-hot-fill",   label: "Bữa tối",        value: fmtVND(dinner) },
        transport?.title  && { icon: "bi-car-front-fill", label: "Phương tiện", value: `${transport.title} — ${fmtVND(transport.cost)}` },
        restaurant?.title && { icon: "bi-shop",           label: "Nhà hàng",    value: `${restaurant.title} — ${fmtVND(restaurant.cost)}` },
        hotel?.title      && { icon: "bi-building",       label: "Khách sạn",   value: `${hotel.title} — ${fmtVND(hotel.cost)}` },
        { icon: "bi-receipt",        label: "Thuế VAT",       value: fmtVND(tax) },
        { icon: "bi-wallet2",        label: "Tạm tính",       value: fmtVND(subTotal) },
    ].filter(Boolean);

    return (
        <div className="cp-root">
            <div className="container">

                {/* Header */}
                <div className="cp-header">
                    <StepBar />
                </div>

                {/* Success banner */}
                <div className="bk-success-banner">
                    <div className="bk-success-icon">
                        <i className="bi bi-check-lg"></i>
                    </div>
                    <div>
                        <h2 className="bk-success-title">
                            {customerName ? `Cảm ơn, ${customerName.split(" ").pop()}!` : "Đặt dịch vụ thành công!"}
                        </h2>
                        <p className="bk-success-desc">
                            Cảm ơn bạn đã đặt dịch vụ với <strong>DAYTRIP</strong>.
                            Chuyến đi đến <strong>{location}</strong> của bạn đã được xác nhận.
                            {customerEmail && <> Hóa đơn sẽ gửi về <strong>{customerEmail}</strong>.</>}
                        </p>
                    </div>
                </div>

                <div className="cp-body">
                    {/* ── Left: Booking summary ── */}
                    <div className="cp-items-col">
                        <h3 className="cp-section-title">
                            <i className="bi bi-clipboard2-check me-2"></i>Chi tiết đặt dịch vụ
                        </h3>

                        <div className="bk-rows">
                            {rows.map(({ icon, label, value, accent }) => (
                                <div className="bk-row" key={label}>
                                    <span className="bk-row-label">
                                        <i className={`bi ${icon} bk-row-icon`}></i>
                                        {label}
                                    </span>
                                    <span className={`bk-row-value ${accent ? "bk-accent" : ""}`}>{value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bk-total-row">
                            <span className="bk-total-label">Tổng cộng</span>
                            <span className="bk-total-value">{fmtVND(total)}</span>
                        </div>

                        <div className="bk-actions">
                            <Link to="/" className="bk-home-btn">
                                <i className="bi bi-house me-2"></i>Về trang chủ
                            </Link>
                            <Link to="/tours" className="bk-tours-btn">
                                <i className="bi bi-compass me-2"></i>Khám phá thêm tour
                            </Link>
                        </div>
                    </div>

                    {/* ── Right: Invoice card ── */}
                    <div className="cp-summary-col">
                        <div className="cp-summary-card">
                            <div className="bk-invoice-icon">
                                <i className="bi bi-file-earmark-text"></i>
                            </div>
                            <h3 className="cp-summary-title">Tải hóa đơn</h3>
                            <p className="bk-invoice-desc">
                                Nhấn vào nút bên dưới để tạo hóa đơn PDF với đầy đủ thông tin đặt dịch vụ. Bạn có thể tải về hoặc in để lưu trữ.
                            </p>

                            <div className="bk-contact-list">
                                <div className="bk-contact-item">
                                    <i className="bi bi-telephone-fill bk-contact-icon"></i>
                                    <span>+0354-1145-105252</span>
                                </div>
                                <div className="bk-contact-item">
                                    <i className="bi bi-envelope-fill bk-contact-icon"></i>
                                    <span>support@daytrip.vn</span>
                                </div>
                            </div>

                            {showInvoiceButton && (
                                <button className="bk-invoice-btn" onClick={handleDownloadInvoice}>
                                    <i className="bi bi-download me-2"></i>Tải hóa đơn PDF
                                </button>
                            )}

                            <div className="bk-note">
                                <i className="bi bi-info-circle me-2"></i>
                                Hóa đơn sẽ được gửi qua email trong vòng 24 giờ
                            </div>
                        </div>

                        {/* Status card */}
                        <div className="bk-status-card">
                            <div className="bk-status-row">
                                <span>Trạng thái</span>
                                <span className="bk-status-badge">Đã xác nhận</span>
                            </div>
                            <div className="bk-status-row">
                                <span>Hủy miễn phí</span>
                                <span className="bk-status-green">Trước 24 giờ</span>
                            </div>
                            <div className="bk-status-row">
                                <span>Thanh toán</span>
                                <span className="bk-status-green">Hoàn tất</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BookingConfirmation;
