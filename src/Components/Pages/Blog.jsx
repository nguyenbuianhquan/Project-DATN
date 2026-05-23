import React, { useState } from "react";
import news1 from '../../assets/news-1.png';
import news2 from '../../assets/news-2.png';
import news3 from '../../assets/news-3.png';
import news4 from '../../assets/news-4.png';
import news5 from '../../assets/news-5.png';
import news6 from '../../assets/news-6.png';
import news7 from '../../assets/news-7.png';
import news8 from '../../assets/news-8.png';
import news9 from '../../assets/news-9.png';

const CATEGORIES = ["Tất Cả", "Du Lịch", "Khám Phá", "Văn Hóa", "Thiên Nhiên", "Ẩm Thực", "Mẹo Hay"];

const ARTICLES = [
    { img: news6, category: "Du Lịch",   title: "Hạ Long — Kỳ Quan Thiên Nhiên Thế Giới Ngay Trên Đất Việt",          desc: "Vịnh Hạ Long với hàng nghìn hòn đảo đá vôi hùng vĩ là điểm đến không thể bỏ qua khi du lịch Việt Nam.",                                                         author: "Minh Anh",   date: "28/04/2025", time: "10 phút đọc" },
    { img: news7, category: "Khám Phá",  title: "Sapa Bốn Mùa: Ruộng Bậc Thang Vàng Và Những Con Đường Sương Mù",     desc: "Khám phá vẻ đẹp bốn mùa của Sapa — từ ruộng bậc thang lúa chín đến những sáng sương mù trắng xóa.",                                                          author: "Hữu Đức",    date: "20/04/2025", time: "8 phút đọc"  },
    { img: news8, category: "Văn Hóa",   title: "Hội An Về Đêm: Ánh Đèn Lồng Và Nhịp Sống Cổ Kính",                   desc: "Hội An đêm xuống lung linh dưới ánh đèn lồng, mang theo hơi thở của một đô thị cổ hàng trăm năm tuổi.",                                                     author: "Thu Hà",     date: "15/04/2025", time: "6 phút đọc"  },
    { img: news1, category: "Du Lịch",   title: "Phú Quốc: Thiên Đường Biển Đảo Không Thể Bỏ Qua",                    desc: "Bãi biển trong xanh, hải sản tươi sống và resort nghỉ dưỡng — Phú Quốc xứng danh đảo ngọc Việt Nam.",                                                        author: "Lan Chi",    date: "10/04/2025", time: "8 phút đọc"  },
    { img: news2, category: "Ẩm Thực",   title: "Khám Phá Ẩm Thực Đường Phố Sài Gòn — Hành Trình Của Vị Giác",       desc: "Từ hủ tiếu gõ đêm khuya đến bánh mì ổ giòn rụm — Sài Gòn là thiên đường ẩm thực đường phố số một Việt Nam.",                                               author: "Minh Tuấn",  date: "05/04/2025", time: "6 phút đọc"  },
    { img: news3, category: "Khám Phá",  title: "Chinh Phục Fansipan: Nóc Nhà Đông Dương Qua Góc Nhìn Người Trẻ",    desc: "Hành trình leo bộ hoặc cáp treo lên đỉnh Fansipan 3.143m — trải nghiệm đỉnh cao không thể quên.",                                                             author: "Quốc Duy",   date: "01/04/2025", time: "9 phút đọc"  },
    { img: news4, category: "Thiên Nhiên",title: "Hang Sơn Đoòng: Khám Phá Hang Động Lớn Nhất Thế Giới",              desc: "Bên trong Sơn Đoòng là cả một thế giới khác — rừng cây, sông ngầm và ánh sáng xuyên trần hang kỳ ảo.",                                                       author: "Bảo Thy",    date: "25/03/2025", time: "7 phút đọc"  },
    { img: news5, category: "Mẹo Hay",   title: "Du Lịch Một Mình: Cách Khám Phá Bản Thân Qua Mỗi Chuyến Đi",       desc: "Solo travel không đáng sợ — đó là cơ hội để bạn tự quyết định hành trình, gặp gỡ người mới và lắng nghe chính mình.",                                       author: "Hồng Nhung", date: "20/03/2025", time: "5 phút đọc"  },
    { img: news9, category: "Mẹo Hay",   title: "Bí Quyết Tiết Kiệm Khi Du Lịch Tự Túc Trong Và Ngoài Nước",        desc: "Đặt vé sớm, ở hostel hay thuê xe máy — những mẹo nhỏ giúp bạn đi nhiều hơn với chi phí ít hơn.",                                                             author: "Thanh Tùng", date: "15/03/2025", time: "11 phút đọc" },
];

const ArticleCard = ({ item }) => (
    <div className="bl-article-card">
        <div className="bl-article-img">
            <img src={item.img} alt={item.title} />
        </div>
        <div className="bl-article-body">
            <span className="bl-tag">{item.category}</span>
            <h6 className="bl-article-title">{item.title}</h6>
            <p className="bl-article-desc">{item.desc}</p>
            <div className="bl-article-footer">
                <div className="bl-article-meta">
                    <span><i className="ri-user-line"></i>{item.author}</span>
                    <span><i className="ri-calendar-line"></i>{item.date}</span>
                    <span><i className="ri-time-line"></i>{item.time}</span>
                </div>
                <a href="#" className="bl-read-more">Đọc thêm <i className="ri-arrow-right-line"></i></a>
            </div>
        </div>
    </div>
);

const BlogSection = () => {
    const [active, setActive] = useState("Tất Cả");

    const featured    = ARTICLES[0];
    const subFeatured = ARTICLES.slice(1, 4);
    const rest        = ARTICLES.slice(4);

    const filtered = active === "Tất Cả"
        ? null
        : ARTICLES.filter(a => a.category === active);

    return (
        <div className="blog-section main-wrapper text-white">
            <div className="container">

                {/* Tiêu đề */}
                <div className="section-title text-center mb-4">
                    <p>Tin Tức & Cảm Hứng</p>
                    <h2>Câu Chuyện Từ Những Chuyến Đi</h2>
                </div>

                {/* Bộ lọc danh mục */}
                <div className="bl-filter-bar mb-5">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`bl-filter-pill${active === cat ? " active" : ""}`}
                            onClick={() => setActive(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* ── Chế độ lọc danh mục ── */}
                {filtered !== null ? (
                    filtered.length === 0 ? (
                        <p className="text-center bl-empty">Chưa có bài viết nào trong danh mục này.</p>
                    ) : (
                        <div className="row g-4">
                            {filtered.map((item, i) => (
                                <div key={i} className="col-lg-4 col-md-6">
                                    <ArticleCard item={item} />
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* ── Chế độ "Tất Cả" — layout kiểu báo chí ── */
                    <>
                        {/* Khu vực tin nổi bật */}
                        <div className="row g-4 mb-5 align-items-stretch">

                            {/* Hero lớn bên trái */}
                            <div className="col-lg-7">
                                <div className="bl-hero-card">
                                    <img src={featured.img} alt={featured.title} />
                                    <div className="bl-hero-overlay">
                                        <span className="bl-tag">{featured.category}</span>
                                        <h2 className="bl-hero-title">{featured.title}</h2>
                                        <p className="bl-hero-desc">{featured.desc}</p>
                                        <div className="bl-hero-meta">
                                            <span><i className="ri-user-line"></i>{featured.author}</span>
                                            <span><i className="ri-calendar-line"></i>{featured.date}</span>
                                            <span><i className="ri-time-line"></i>{featured.time}</span>
                                        </div>
                                        <a href="#" className="bl-hero-btn">
                                            Đọc bài viết <i className="ri-arrow-right-line"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* 3 tin phụ bên phải */}
                            <div className="col-lg-5 d-flex flex-column gap-3">
                                {subFeatured.map((item, i) => (
                                    <a href="#" key={i} className="bl-sub-post text-decoration-none">
                                        <div className="bl-sub-thumb">
                                            <img src={item.img} alt={item.title} />
                                        </div>
                                        <div className="bl-sub-body">
                                            <span className="bl-tag">{item.category}</span>
                                            <h6 className="bl-sub-title">{item.title}</h6>
                                            <div className="bl-sub-meta">
                                                <span><i className="ri-user-line"></i>{item.author}</span>
                                                <span><i className="ri-time-line"></i>{item.time}</span>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Divider — Tin mới nhất */}
                        <div className="bl-section-label mb-4">
                            <span className="bl-section-label-line"></span>
                            <span className="bl-section-label-text">
                                <i className="ri-newspaper-line me-2"></i>Tin Mới Nhất
                            </span>
                            <span className="bl-section-label-line"></span>
                        </div>

                        {/* Lưới bài còn lại */}
                        <div className="row g-4">
                            {rest.map((item, i) => (
                                <div key={i} className="col-lg-4 col-md-6">
                                    <ArticleCard item={item} />
                                </div>
                            ))}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default BlogSection;
