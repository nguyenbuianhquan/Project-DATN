import React, { useState, useContext } from "react";
import CheckoutPage from "./ConfirmYourBooking";
import { CartContext } from "../../Context/CartContext";
import { Link } from "react-router-dom";

const fmtVND = (n) => Math.round(n).toLocaleString('vi-VN') + ' ₫';

const StepBar = ({ current }) => {
    const steps = ["Giỏ hàng", "Thông tin", "Thanh toán", "Hoàn tất"];
    return (
        <div className="cp-steps">
            {steps.map((label, i) => {
                const n = i + 1;
                const done = n < current;
                const active = n === current;
                return (
                    <React.Fragment key={n}>
                        <div className={`cp-step ${done ? "cp-step-done" : ""} ${active ? "cp-step-active" : ""}`}>
                            <div className="cp-step-circle">
                                {done ? <i className="bi bi-check-lg"></i> : n}
                            </div>
                            <span className="cp-step-label">{label}</span>
                        </div>
                        {i < steps.length - 1 && <div className={`cp-step-line ${done ? "cp-step-line-done" : ""}`} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const Cart = () => {
    const { cartItems, addToCart, removeFromCart } = useContext(CartContext);
    const [showCheckout, setShowCheckout] = useState(false);

    const increaseQty = (id) => {
        const item = cartItems.find(i => i.id === id);
        if (item) addToCart({ ...item, quantity: (item.quantity || 1) + 1 });
    };
    const decreaseQty = (id) => {
        const item = cartItems.find(i => i.id === id);
        if (!item) return;
        if ((item.quantity || 1) > 1) addToCart({ ...item, quantity: item.quantity - 1 });
        else removeFromCart(id);
    };

    const subtotal   = cartItems.reduce((s, it) => s + (parseFloat(it.price) || 0) * (it.quantity || 1), 0);
    const vat        = subtotal * 0.05;
    const grandTotal = subtotal + vat;

    if (showCheckout) return <CheckoutPage />;

    return (
        <div className="cp-root">
            <div className="container">
                <div className="cp-header">
                    <h2 className="cp-title">Giỏ hàng</h2>
                    <p className="cp-breadcrumb">
                        <Link to="/">Trang chủ</Link> / Giỏ hàng
                    </p>
                    <StepBar current={1} />
                </div>

                <div className="cp-body">
                    {/* Items */}
                    <div className="cp-items-col">
                        <h3 className="cp-section-title">
                            <i className="bi bi-bag-check me-2"></i>
                            Dịch vụ đã chọn
                            {cartItems.length > 0 && (
                                <span className="cp-item-count">{cartItems.length}</span>
                            )}
                        </h3>

                        {cartItems.length === 0 ? (
                            <div className="cp-empty">
                                <div className="cp-empty-icon"><i className="bi bi-cart3"></i></div>
                                <h5>Giỏ hàng trống</h5>
                                <p>Hãy khám phá và thêm dịch vụ để bắt đầu hành trình</p>
                                <div className="cp-empty-links">
                                    <Link to="/tours"       className="cp-empty-btn cp-btn-tour"><i className="bi bi-compass me-1"></i>Tour</Link>
                                    <Link to="/hotels"      className="cp-empty-btn cp-btn-hotel"><i className="bi bi-building me-1"></i>Khách sạn</Link>
                                    <Link to="/transport"   className="cp-empty-btn cp-btn-transport"><i className="bi bi-car-front me-1"></i>Phương tiện</Link>
                                    <Link to="/restaurants" className="cp-empty-btn cp-btn-restaurant"><i className="bi bi-cup-hot me-1"></i>Nhà hàng</Link>
                                </div>
                            </div>
                        ) : (
                            <div className="cp-item-list">
                                {cartItems.map(item => {
                                    const qty   = item.quantity || 1;
                                    const price = parseFloat(item.price) || 0;
                                    const name  = item.title || item.name || "Dịch vụ";
                                    return (
                                        <div key={item.id} className="cp-item-card">
                                            <img
                                                src={item.image} alt={name}
                                                className="cp-item-img"
                                                onError={e => { e.target.onerror = null; e.target.src = "/Images/image1.jpeg"; }}
                                            />
                                            <div className="cp-item-info">
                                                <p className="cp-item-name">{name}</p>
                                                <p className="cp-item-meta">
                                                    <i className="bi bi-tag me-1"></i>
                                                    {fmtVND(price)} / đơn vị
                                                </p>
                                            </div>

                                            <p className="cp-item-price">{fmtVND(price * qty)}</p>

                                            <button
                                                className="cp-remove-btn"
                                                onClick={() => removeFromCart(item.id)}
                                                title="Xóa"
                                            >
                                                <i className="bi bi-trash3"></i>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="cp-summary-col">
                        <div className="cp-summary-card">
                            <h3 className="cp-summary-title">Tổng đơn hàng</h3>

                            <div className="cp-price-rows">
                                <div className="cp-price-row">
                                    <span>Tạm tính</span>
                                    <span>{fmtVND(subtotal)}</span>
                                </div>
                                <div className="cp-price-row">
                                    <span>Thuế VAT (5%)</span>
                                    <span>{fmtVND(vat)}</span>
                                </div>
                                <div className="cp-price-row cp-price-total">
                                    <span>Tổng cộng</span>
                                    <span className="cp-total-num">{fmtVND(grandTotal)}</span>
                                </div>
                            </div>

                            <button
                                className="cp-continue-btn"
                                disabled={cartItems.length === 0}
                                onClick={() => setShowCheckout(true)}
                            >
                                Tiếp tục <i className="bi bi-arrow-right ms-2"></i>
                            </button>

                            <div className="cp-guarantee">
                                <i className="bi bi-shield-check text-success me-2"></i>
                                Miễn phí hủy trước 24 giờ
                            </div>
                        </div>

                        {cartItems.length > 0 && (
                            <div className="cp-trust-row">
                                <span><i className="bi bi-lock-fill"></i> Thanh toán bảo mật</span>
                                <span><i className="bi bi-arrow-counterclockwise"></i> Hoàn tiền 24h</span>
                                <span><i className="bi bi-headset"></i> Hỗ trợ 24/7</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
