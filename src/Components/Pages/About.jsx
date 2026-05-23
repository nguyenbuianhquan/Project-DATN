import React from 'react'
import aboutbanner from '../../assets/about-banner-three.png'
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import brand1 from '../../assets/brand-1.jpeg'
import brand2 from '../../assets/brand-2.jpeg'
import brand3 from '../../assets/brand-3.jpeg'
import brand4 from '../../assets/brand-4.png'
import brand5 from '../../assets/brand-5.png'
import tst from '../../assets/testimonial-1.jpeg'
import tstbanner from '../../assets/testimonial-banner.png'

function About() {
    return (
        <>
            {/* ── Giới thiệu ────────────────────────────── */}
            <div className="about-section section">
                <div className="container about">
                    <div className="row align-items-center">
                        <div className="col-lg-6">
                            <div className="section-title">
                                <div className="row">
                                    <p>Về Chúng Tôi</p>
                                    <h2>Khám Phá Thế Giới Cùng DAYTRIP</h2>
                                </div>
                            </div>
                            <p className="about-para">DAYTRIP là nền tảng du lịch trực tuyến giúp bạn lên kế hoạch và đặt chỗ dễ dàng cho mọi chuyến đi. Từ những tour khám phá danh lam thắng cảnh trong nước đến hành trình quốc tế đáng nhớ — chúng tôi đồng hành cùng bạn ở mỗi bước đi.</p>
                            <p className="about-para">Với đội ngũ chuyên nghiệp và mạng lưới đối tác rộng khắp, DAYTRIP cam kết mang đến những trải nghiệm du lịch an toàn, chất lượng và giá tốt nhất thị trường.</p>
                            <button className="btn">Khám Phá Ngay <i className="ri-arrow-right-up-line"></i></button>
                            <div className="user-icon d-flex align-items-center gap-3 mt-4">
                                <i className="ri-user-line"></i>
                                <p className='about-para m-0'>Hơn 2.500 khách hàng đã đặt tour trong 24 giờ qua</p>
                            </div>
                        </div>
                        <div className="col-lg-6 mt-xl-0 mt-5">
                            <div className="about-img">
                                <img src={aboutbanner} alt="Du lịch cùng DAYTRIP" className="img-fluid rounded-4" />
                            </div>
                            <div className="row stats-box mt-5 text-center">
                                <div className="col-md-4 mb-3">
                                    <h4>150k+</h4>
                                    <span>Khách Hài Lòng</span>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <h4>95.7%</h4>
                                    <span>Tỷ Lệ Hài Lòng</span>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <h4>5.000+</h4>
                                    <span>Tour Hoàn Thành</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Vì sao chọn DAYTRIP ───────────────────── */}
            <div className="ab-features-section section">
                <div className="container">
                    <div className="section-title mb-5">
                        <div className="row text-center">
                            <p>Điểm Nổi Bật</p>
                            <h2>Vì Sao Hàng Triệu Người <br />Tin Chọn DAYTRIP?</h2>
                        </div>
                    </div>
                    <div className="row g-4">
                        <div className="col-md-3 col-sm-6">
                            <div className="ab-feature-card text-center">
                                <div className="ab-feature-icon mb-3">
                                    <i className="ri-shield-check-line"></i>
                                </div>
                                <h5>An Toàn Tuyệt Đối</h5>
                                <p>Mọi tour và dịch vụ đều được kiểm duyệt nghiêm ngặt, đảm bảo an toàn cho hành khách.</p>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <div className="ab-feature-card text-center">
                                <div className="ab-feature-icon mb-3">
                                    <i className="ri-price-tag-3-line"></i>
                                </div>
                                <h5>Giá Tốt Nhất</h5>
                                <p>Cam kết giá cạnh tranh nhất thị trường. Nếu bạn tìm được rẻ hơn, chúng tôi hoàn tiền chênh lệch.</p>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <div className="ab-feature-card text-center">
                                <div className="ab-feature-icon mb-3">
                                    <i className="ri-customer-service-2-line"></i>
                                </div>
                                <h5>Hỗ Trợ 24/7</h5>
                                <p>Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc và đồng hành suốt hành trình.</p>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <div className="ab-feature-card text-center">
                                <div className="ab-feature-icon mb-3">
                                    <i className="ri-smartphone-line"></i>
                                </div>
                                <h5>Đặt Chỗ Dễ Dàng</h5>
                                <p>Chỉ vài bước đơn giản trên điện thoại hoặc máy tính, bạn đã có một chuyến đi hoàn hảo.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sứ mệnh ──────────────────────────────── */}
            <div className="ab-mission-section section">
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6">
                            <div className="section-title mb-4">
                                <p>Sứ Mệnh</p>
                                <h2>Mang Thế Giới Đến Gần Hơn Với Bạn</h2>
                            </div>
                            <p className="about-para">Chúng tôi tin rằng du lịch không chỉ là di chuyển từ nơi này đến nơi khác — đó là hành trình mở rộng tầm nhìn, kết nối con người và nuôi dưỡng tâm hồn.</p>
                            <div className="ab-mission-list mt-4">
                                <div className="ab-mission-item d-flex align-items-start gap-3 mb-4">
                                    <i className="ri-map-pin-line ab-mission-icon mt-1"></i>
                                    <div>
                                        <h6>Điểm Đến Phong Phú</h6>
                                        <p className="about-para mb-0">Hơn 200 điểm đến trong và ngoài nước, từ bãi biển nhiệt đới đến núi rừng hùng vĩ.</p>
                                    </div>
                                </div>
                                <div className="ab-mission-item d-flex align-items-start gap-3 mb-4">
                                    <i className="ri-group-line ab-mission-icon mt-1"></i>
                                    <div>
                                        <h6>Đội Ngũ Chuyên Nghiệp</h6>
                                        <p className="about-para mb-0">Hướng dẫn viên giàu kinh nghiệm, am hiểu văn hóa địa phương và tận tâm với khách hàng.</p>
                                    </div>
                                </div>
                                <div className="ab-mission-item d-flex align-items-start gap-3">
                                    <i className="ri-leaf-line ab-mission-icon mt-1"></i>
                                    <div>
                                        <h6>Du Lịch Bền Vững</h6>
                                        <p className="about-para mb-0">Cam kết bảo vệ môi trường và hỗ trợ cộng đồng địa phương trong mọi hoạt động du lịch.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="ab-stat-card text-center">
                                        <i className="ri-global-line"></i>
                                        <h3>200+</h3>
                                        <p>Điểm Đến</p>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="ab-stat-card text-center">
                                        <i className="ri-calendar-check-line"></i>
                                        <h3>10+</h3>
                                        <p>Năm Kinh Nghiệm</p>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="ab-stat-card text-center">
                                        <i className="ri-hotel-line"></i>
                                        <h3>500+</h3>
                                        <p>Đối Tác Khách Sạn</p>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="ab-stat-card text-center">
                                        <i className="ri-star-smile-line"></i>
                                        <h3>4.9★</h3>
                                        <p>Điểm Đánh Giá</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Đối tác ───────────────────────────────── */}
            <div className="brands-container section">
                <div className="container">
                    <div className="section-title text-center mb-4">
                        <p>Đối Tác Tin Cậy</p>
                        <h5 className="text-white">Các Đối Tác Của Chúng Tôi</h5>
                    </div>
                    <div className="row">
                        <Swiper
                            className="brand-swiper"
                            slidesPerView={4}
                            spaceBetween={30}
                            loop={true}
                            autoplay={true}
                            centeredSlides={true}
                        >
                            {[brand1, brand2, brand3, brand4, brand5, brand3, brand4].map((b, i) => (
                                <SwiperSlide key={i}>
                                    <div className="brand-image">
                                        <img src={b} alt="partner-logo" className="img-fluid" />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </div>

            {/* ── Cảm nhận khách hàng ───────────────────── */}
            <div className="testimonials-container section">
                <div className="container">
                    <div className="row text-center mb-5">
                        <div className="section-title">
                            <p>Cảm Nhận Khách Hàng</p>
                            <h2>Hành Khách Nói Gì Về<br /> Chúng Tôi?</h2>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <Swiper className="tst-swiper" loop={true}>
                                <SwiperSlide>
                                    <div className="tst-item">
                                        <div className="tst-user d-flex align-items-center gap-2">
                                            <img src={tst} alt="testimonials" width={50} height={50} className='img-fluid rounded-circle border border-white' />
                                            <p className='mb-0 fw-bold text-white fs-6'>Nguyễn Minh Tuấn<span className='fw-normal'> — Du khách</span></p>
                                        </div>
                                        <div className="tst-rattings mt-3 mb-4">
                                            {[...Array(5)].map((_, i) => <i key={i} className="ri-star-fill ps-1"></i>)}
                                        </div>
                                        <p className='fw-bold fs-5 mb-4'>
                                            "Tôi đã đặt tour Đà Nẵng qua DAYTRIP và thực sự ấn tượng. Hướng dẫn viên nhiệt tình, lịch trình hợp lý, khách sạn sạch đẹp. Chắc chắn sẽ quay lại!"
                                        </p>
                                        <div className="tst-footer d-flex align-items-center justify-content-between">
                                            <a href="#" className="text-white text-decoration-none fw-semibold text-uppercase fs-4 m-0">
                                                DAY<span style={{ color: "rgb(242, 111, 85)" }}>TRIP</span>
                                            </a>
                                            <p className='mb-0'>Tháng 3, 2025</p>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide>
                                    <div className="tst-item">
                                        <div className="tst-user d-flex align-items-center gap-2">
                                            <img src={tst} alt="testimonials" width={50} height={50} className='img-fluid rounded-circle border border-white' />
                                            <p className='mb-0 fw-bold text-white fs-6'>Trần Thu Hương<span className='fw-normal'> — Du khách</span></p>
                                        </div>
                                        <div className="tst-rattings mt-3 mb-4">
                                            {[...Array(5)].map((_, i) => <i key={i} className="ri-star-fill ps-1"></i>)}
                                        </div>
                                        <p className='fw-bold fs-5 mb-4'>
                                            "Gia đình tôi rất hài lòng với chuyến đi Phú Quốc. DAYTRIP lo từng chi tiết nhỏ, mọi thứ đều suôn sẻ. Cảm ơn đội ngũ rất nhiều!"
                                        </p>
                                        <div className="tst-footer d-flex align-items-center justify-content-between">
                                            <a href="#" className="text-white text-decoration-none fw-semibold text-uppercase fs-4 m-0">
                                                DAY<span style={{ color: "rgb(242, 111, 85)" }}>TRIP</span>
                                            </a>
                                            <p className='mb-0'>Tháng 2, 2025</p>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            </Swiper>
                        </div>
                        <div className="col-md-6">
                            <div className="tst-banner rounded-5 overflow-hidden position-relative">
                                <img src={tstbanner} alt="testimonials-banner" className='img-fluid' />
                                <span className="bi bi-play-fill"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Ưu đãi đặc biệt ──────────────────────── */}
            <div className="banner-container section">
                <div className="container">
                    <div className="row text-center mb-5">
                        <div className="section-title">
                            <p>Ưu Đãi Đặc Biệt</p>
                            <h2>Ưu Đãi Mùa Hè — Giảm Đến 50%</h2>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-lg-6 mb-4">
                            <div className="banner-content z-1 py-5 px-4 rounded-3 banner-bg-1 text-white">
                                <p className='highlight-text'>Tiết kiệm đến</p>
                                <h4 className='fs-1 fw-semibold'>50%</h4>
                                <p className='pera fs-4 fw-bold'>Khám Phá Đông Nam Á</p>
                                <div className="location d-flex align-items-center gap-2">
                                    <i className="bi bi-geo-alt"></i>
                                    <p className='name mb-0'>Đến với DAYTRIP khám phá ngay</p>
                                </div>
                                <button className='btn banner-btn px-4'>Đặt Ngay</button>
                            </div>
                        </div>
                        <div className="col-lg-6 mb-4">
                            <div className="banner-content z-1 py-5 px-4 rounded-3 banner-bg-1 text-white">
                                <h4 className='fs-1 fw-semibold'>Khách Sạn Lân Cận</h4>
                                <p className="pera">
                                    Giảm đến <span className="highlights-text">50%</span> hôm nay
                                </p>
                                <div className="location d-flex align-items-center gap-2">
                                    <i className="bi bi-geo-alt"></i>
                                    <p className='name mb-0'>Đến với DAYTRIP khám phá ngay</p>
                                </div>
                                <button className='btn banner-btn px-4'>Đặt Ngay</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default About
