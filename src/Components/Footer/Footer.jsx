import React from 'react';
import { Link } from 'react-router-dom';
import brand1 from '../../assets/brand-1.jpeg';
import brand2 from '../../assets/brand-2.jpeg';
import brand3 from '../../assets/brand-3.jpeg';
import brand4 from '../../assets/brand-4.png';
import brand5 from '../../assets/brand-5.png';

function Footer() {
    return (
        <footer className="footer-section text-white pt-5">
            <div className="container">
                {/* Top Footer Columns */}
                <div className="row gy-4">
                    <div className="col-lg-3 col-md-6">
                        <h4 className="mb-3">Công Ty</h4>
                        <ul className="list-unstyled">
                            <li><Link to="/about"   className="footer-link"><i className="ri-arrow-right-s-line"></i> Về Chúng Tôi</Link></li>
                            <li><Link to="/blog"    className="footer-link"><i className="ri-arrow-right-s-line"></i> Tin Tức</Link></li>
                            <li><Link to="/contact" className="footer-link"><i className="ri-arrow-right-s-line"></i> Câu Hỏi Thường Gặp</Link></li>
                            <li><Link to="/contact" className="footer-link"><i className="ri-arrow-right-s-line"></i> Liên Hệ</Link></li>
                        </ul>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <h4 className="mb-3">Khám Phá</h4>
                        <ul className="list-unstyled">
                            <li><Link to="/tours"       className="footer-link"><i className="ri-map-pin-line"></i> Danh Sách Tour</Link></li>
                            <li><Link to="/hotels"      className="footer-link"><i className="ri-map-pin-line"></i> Khách Sạn</Link></li>
                            <li><Link to="/transport"   className="footer-link"><i className="ri-car-line"></i> Phương Tiện</Link></li>
                            <li><Link to="/restaurants" className="footer-link"><i className="ri-restaurant-line"></i> Nhà Hàng</Link></li>
                        </ul>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <h4 className="mb-3">Liên Kết Nhanh</h4>
                        <ul className="list-unstyled">
                            <li><Link to="/"        className="footer-link"><i className="ri-home-4-line"></i> Trang Chủ</Link></li>
                            <li><Link to="/about"   className="footer-link"><i className="ri-information-line"></i> Về Chúng Tôi</Link></li>
                            <li><Link to="/contact" className="footer-link"><i className="ri-phone-line"></i> Liên Hệ</Link></li>
                            <li><Link to="/blog"    className="footer-link"><i className="ri-newspaper-line"></i> Tin Tức</Link></li>
                        </ul>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <h4 className="mb-3">Liên Hệ</h4>
                        <p className="small"><i className="ri-map-pin-line me-2"></i>Việt Nam</p>
                        <p className="small"><i className="ri-phone-line me-2"></i>(+84) 123 456 789</p>
                        <p className="small"><i className="ri-mail-line me-2"></i>quanskun9603@gmail.com</p>
                    </div>
                </div>

                {/* Middle Section with Newsletter */}
                <div className="footer-middel mt-5 px-4 py-5">
                    <div className="row align-items-center">
                        <div className="col-lg-8">
                            <Link to="/" className="text-decoration-none">
                                <h2 className="navbar-brand text-white fs-2 text-uppercase">DAY<span style={{ color: "#f26f55" }}>TRIP</span></h2>
                            </Link>
                            <p className="small mt-2 w-50">
                                Du lịch là hành trình khám phá và trải nghiệm phong phú, giúp bạn mở rộng tầm nhìn qua từng vùng đất, nền văn hóa và phong cảnh mới.
                            </p>
                            <div className="d-flex flex-wrap gap-3 mt-3">
                                <Link to="/contact" className="footer-link">Điều Khoản Sử Dụng</Link>
                                <Link to="/contact" className="footer-link">Chính Sách &amp; Cookie</Link>
                                <Link to="/about"   className="footer-link">Cách Thức Hoạt Động</Link>
                            </div>
                        </div>
                        <div className="col-lg-4 mt-4 mt-lg-0">
                            <h5 className="fw-bold mb-3">Đăng Ký Nhận Bản Tin</h5>
                            <form className="position-relative">
                                <input type="email" className="form-control" placeholder="Nhập email của bạn" />
                                <button type="submit" className="btn position-absolute top-0 end-0 mt-1 me-2">
                                    <i className="ri-send-plane-line"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Partner logos */}
                <div className="footer-partners">
                    <p className="footer-partners-label">Đối tác tin cậy</p>
                    <div className="footer-partners-row">
                        <img src={brand1} alt="partner" className="footer-partner-img" />
                        <img src={brand2} alt="partner" className="footer-partner-img" />
                        <img src={brand3} alt="partner" className="footer-partner-img" />
                        <img src={brand4} alt="partner" className="footer-partner-img" />
                        <img src={brand5} alt="partner" className="footer-partner-img" />
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="footer-bottom text-center mt-4 pt-3 pb-3">
                    <div className="row">
                        <div className="col-md-6 text-start">
                            <h6 className="mb-0 small"></h6>
                        </div>
                        <div className="col-md-6 text-end">
                            <h6 className="mb-0 small"></h6>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
