# Giải thích chi tiết sửa đổi TourDetail.jsx (v3 – Booking.com style)

> Tài liệu này giúp bạn hiểu từng quyết định thiết kế + code,
> để trả lời tốt khi bị hỏi hoặc bắt sửa trực tiếp.

---

## Tổng quan thay đổi

| Phần | Trước | Sau |
|------|-------|-----|
| Layout đầu trang | Hero ảnh full-width + chữ đè lên | Breadcrumb + tiêu đề + lưới ảnh (Booking.com) |
| Ảnh sản phẩm | Swiper carousel | 1 ảnh lớn + lưới 2×2 nhỏ |
| Chọn giờ | `<select>` native (bị vỡ giao diện) | Custom dropdown React |
| Số khách | Dropdown select | Nút + / − |
| Cột nội dung | Tabs đơn giản | Tabs có icon + section cards |
| Booking widget | Bootstrap form cơ bản | Card thiết kế lại hoàn toàn |

---

## 1. Breadcrumb điều hướng

```jsx
<nav className="td-breadcrumb">
  <span className="td-crumb" onClick={() => navigate('/')}>Trang chủ</span>
  <i className="ri-arrow-right-s-line"></i>
  <span className="td-crumb" onClick={() => navigate('/tours')}>Tours</span>
  <i className="ri-arrow-right-s-line"></i>
  <span className="td-crumb active">{tour.title}</span>
</nav>
```

**Tại sao cần breadcrumb?**
- Cho người dùng biết mình đang ở đâu trong cấu trúc trang
- Tạo shortcut quay lại trang danh sách mà không cần nút "Back" của trình duyệt
- Booking.com, Airbnb, Agoda đều có breadcrumb ở trang chi tiết

**`navigate('/')`** — gọi `useNavigate` từ React Router, điều hướng đến path `/` mà không reload trang (SPA behavior).

**CSS cho breadcrumb:**
```css
.td-crumb.active {
  color: rgba(255,255,255,0.8);
  cursor: default;
  pointer-events: none;   /* tắt click vì đây là trang hiện tại */
}
```
`pointer-events: none` quan trọng — trang hiện tại không nên click được.

---

## 2. Page Header – Tiêu đề + Meta

```jsx
<div className="td-page-header">
  <div className="container">
    <nav className="td-breadcrumb">...</nav>
    <h1 className="td-page-title">{tour.title}</h1>
    {tour.tag && <span className="td-page-tag">{tour.tag}</span>}
    <div className="td-meta-row">
      <span className="td-meta-rating"><i className="ri-star-fill"></i> {tour.rating}</span>
      <span className="td-meta-reviews">({tour.reviews} đánh giá)</span>
      <span className="td-meta-sep">·</span>
      <span className="td-meta-item"><i className="ri-map-pin-2-fill"></i> {tour.location}</span>
      ...
    </div>
  </div>
</div>
```

**`{tour.tag && <span>...</span>}`** — render có điều kiện: chỉ hiện tag nếu `tour.tag` tồn tại (không `null`/`undefined`/`""`).

**`clamp()` trong CSS:**
```css
.td-page-title {
  font-size: clamp(1.4rem, 3vw, 2rem);
}
```
- `clamp(min, ideal, max)` = tối thiểu 1.4rem, lý tưởng 3% chiều rộng viewport, tối đa 2rem
- Tự động responsive mà không cần media query riêng

---

## 3. Gallery Grid – Layout Booking.com

### CSS Grid

```css
.td-gallery-grid {
  display: grid;
  grid-template-columns: 62% 38%;   /* ảnh lớn : ảnh nhỏ */
  height: 420px;
  gap: 6px;
  border-radius: 16px;
  overflow: hidden;                 /* cắt góc bo */
}
.td-gallery-thumbs {
  display: grid;
  grid-template-columns: 1fr 1fr;   /* 2 cột */
  grid-template-rows: 1fr 1fr;      /* 2 hàng = lưới 2×2 */
  gap: 6px;
}
```

**Tại sao dùng CSS Grid thay Flexbox ở đây?**
- Grid: kiểm soát cả 2 chiều (hàng + cột) cùng lúc — phù hợp layout 2D
- Flexbox: tốt cho layout 1 chiều (hàng hoặc cột)
- Lưới 2×2 là bài toán 2D → dùng Grid đúng hơn

### JSX gallery

```jsx
const galleryImgs = Array(5).fill(tour.image);  // demo: lặp 1 ảnh

<div className="td-gallery-grid">
  {/* Ảnh lớn bên trái */}
  <div className="td-gallery-main" onClick={() => setLightboxSrc(galleryImgs[0])}>
    <img src={galleryImgs[0]} className="td-gallery-img" />
  </div>

  {/* Lưới 2×2 bên phải */}
  <div className="td-gallery-thumbs">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="td-gallery-thumb" onClick={() => setLightboxSrc(galleryImgs[i])}>
        <img src={galleryImgs[i]} className="td-gallery-img" />
        {i === 4 && (
          <div className="td-gallery-more">...</div>
        )}
      </div>
    ))}
  </div>
</div>
```

**`Array(5).fill(tour.image)`** — tạo mảng 5 phần tử, tất cả đều là `tour.image`. Dữ liệu thực chỉ có 1 ảnh → dùng trick này để hiển thị đủ ô. Production sẽ có mảng ảnh thực.

**Overlay ô cuối — `{i === 4 && ...}`:**
```css
.td-gallery-more {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);   /* nền tối mờ */
  backdrop-filter: blur(2px);      /* làm mờ ảnh bên dưới */
}
.td-gallery-thumb:hover .td-gallery-more {
  background: rgba(242,111,85,0.65); /* màu cam khi hover */
}
```

### Hiệu ứng zoom ảnh khi hover

```css
.td-gallery-img {
  transition: transform 0.35s ease;
}
.td-gallery-main:hover .td-gallery-img,
.td-gallery-thumb:hover .td-gallery-img {
  transform: scale(1.04);   /* phóng to nhẹ */
}
```

Selector cha → con (`.td-gallery-main:hover .td-gallery-img`):
khi hover vào `.td-gallery-main`, áp dụng transform cho `.td-gallery-img` bên trong nó.

---

## 4. Custom Dropdown cho "Giờ khởi hành"

### Tại sao không dùng `<select>` native?

`<select>` native có nhiều vấn đề:
1. **Styling rất hạn chế** — không thể đổi màu nền dropdown trên nhiều browser
2. **Giao diện trắng xóa** như ảnh bạn chụp — hệ thống render theo style OS
3. **Không thêm được icon, animation, checkbox** vào từng option

### Giải pháp: React state + `useRef` click-outside

```jsx
const [showTimeDrop, setShowTimeDrop] = useState(false);
const timeDropRef = useRef(null);

// Đóng dropdown khi click ra ngoài
useEffect(() => {
  const handler = (e) => {
    if (timeDropRef.current && !timeDropRef.current.contains(e.target)) {
      setShowTimeDrop(false);
    }
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);
```

**`useRef`** — tạo "ref" gắn vào DOM element, không trigger re-render khi thay đổi (khác `useState`).

**`contains(e.target)`** — kiểm tra xem element người dùng vừa click (`e.target`) có nằm trong vùng dropdown (`timeDropRef.current`) không. Nếu không → đóng dropdown.

**`return () => document.removeEventListener(...)`** — cleanup function: khi component unmount, gỡ event listener để tránh memory leak.

### JSX custom dropdown

```jsx
<div className="td-cs-wrap" ref={timeDropRef}>
  {/* Nút trigger */}
  <button
    type="button"
    className={`td-cs-btn${showTimeDrop ? ' open' : ''}`}
    onClick={() => setShowTimeDrop(v => !v)}
  >
    <i className="ri-time-line"></i>
    <span>{bookTime} sáng</span>
    <i className={`ri-arrow-${showTimeDrop ? 'up' : 'down'}-s-line td-cs-arrow`}></i>
  </button>

  {/* Danh sách options – chỉ render khi showTimeDrop = true */}
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
```

**`setShowTimeDrop(v => !v)`** — functional update: dùng khi giá trị mới phụ thuộc vào giá trị cũ (toggle). An toàn hơn `setShowTimeDrop(!showTimeDrop)` trong concurrent React.

**`{bookTime === t ? ' selected' : ''}`** — template literal thêm class `selected` nếu đây là giá trị đang chọn.

**`{bookTime === t && <i>...checkmark</i>}`** — hiện checkmark chỉ ở option được chọn.

### CSS dropdown animation

```css
.td-cs-options {
  animation: csDropIn 0.15s ease;
}
@keyframes csDropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Dropdown xuất hiện từ trên xuống (dịch chuyển 6px + fade in) — UX tốt hơn hiện ngay.

---

## 5. Booking Widget – Giải thích chi tiết

### Cấu trúc

```
td-bk-card
├── td-bk-header   (giá + badge xác thực)
└── td-bk-body
    ├── td-bk-field  → date input
    ├── td-bk-field  → custom dropdown (giờ)
    ├── td-bk-field  → guest counter +/-
    ├── td-breakdown (bảng tính giá)
    ├── td-book-btn  (nút đặt)
    └── td-bk-guarantees
```

### Nút +/− số khách

```jsx
<button
  type="button"
  className="td-guest-btn"
  onClick={() => setGuests(Math.max(1, guests - 1))}
  disabled={guests <= 1}
>
```

- `Math.max(1, guests - 1)` = giảm nhưng không xuống dưới 1
- `Math.min(10, guests + 1)` = tăng nhưng không quá 10
- `disabled={guests <= 1}` = nút xám + không click được khi đã ở min/max

**Tại sao dùng `type="button"`?**
Nếu button nằm trong form mà không có `type="button"`, mặc định nó là `type="submit"` → click vào nút +/- sẽ submit form. `type="button"` tắt hành vi submit đó.

### Bảng tính giá

```jsx
const total = tour.price * guests;      // giá gốc × số khách

// Hiển thị:
{formatVND(tour.price)} × {guests} người  →  {formatVND(total)}
Thuế & phí (10%)                          →  {formatVND(Math.round(total * 0.1))}
Tổng cộng                                 →  {formatVND(Math.round(total * 1.1))}
```

`total * 1.1 = total + 10%` — công thức tính tổng bao gồm thuế.

`Math.round()` — làm tròn để không có số lẻ (VD: 2,900,000 × 1.1 = 3,190,000, không phải 3,190,000.000001).

---

## 6. Những thay đổi quan trọng khác

### Bỏ Swiper import

```jsx
// Cũ:
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

// Mới: không import nữa
```

Swiper không cần vì đã dùng gallery grid tĩnh. Bỏ import giúp giảm bundle size.

### Thêm `useRef` vào import

```jsx
// Cũ:
import React, { useState, useEffect } from 'react';

// Mới:
import React, { useState, useEffect, useRef } from 'react';
```

`useRef` cần thêm vì custom dropdown dùng ref để detect click outside.

### Chính sách hủy dùng `.map()`

```jsx
// Cũ: viết tay từng item
<div className="td-cancel-item green">...</div>
<div className="td-cancel-item yellow">...</div>
<div className="td-cancel-item red">...</div>

// Mới: dữ liệu tách ra, render bằng map
{[
  { color: 'green',  title: 'Hủy trước 7 ngày',     desc: 'Hoàn tiền 100%' },
  { color: 'yellow', title: 'Hủy trước 3–7 ngày',    desc: 'Hoàn tiền 50%'  },
  { color: 'red',    title: 'Hủy trong vòng 3 ngày', desc: 'Không hoàn tiền' },
].map((item, i) => (
  <div className={`td-cancel-item ${item.color}`} key={i}>
    <div className={`td-cancel-dot ${item.color}`}></div>
    <div><strong>{item.title}</strong><span> — {item.desc}</span></div>
  </div>
))}
```

**Nguyên tắc DRY** (Don't Repeat Yourself): tách data ra array rồi map, thay vì copy-paste HTML 3 lần.

---

## 7. Responsive Design

| Breakpoint | Gallery | Booking widget | Tabs |
|------------|---------|----------------|------|
| Desktop (≥ 992px) | 62%/38% grid | Sticky, 4 cột | Tabs + chữ |
| Tablet (≥ 768px) | Giữ nguyên | Static, full width | Tabs + chữ |
| Mobile (< 768px) | Cột đơn: 1 ảnh lớn + 4 thumb ngang | Static | Chỉ icon |

**Gallery mobile:**
```css
@media (max-width: 767px) {
  .td-gallery-grid {
    grid-template-columns: 1fr;   /* bỏ 2 cột, về 1 cột */
    height: auto;
  }
  .td-gallery-main { height: 220px; }
  .td-gallery-thumbs {
    height: 120px;
    grid-template-rows: 1fr;           /* 1 hàng thay 2 hàng */
    grid-template-columns: repeat(4, 1fr);  /* 4 ô ngang */
  }
}
```

---

## Câu hỏi phản biện thường gặp

**Q: Tại sao không dùng `<select>` thay vì tự làm dropdown?**
A: `<select>` native không style được trên mọi browser — dropdown list luôn render theo style hệ điều hành, màu nền, font không đổi được. Khi dark theme, dropdown trắng xóa trông rất khó chịu (đúng lỗi trong screenshot). Custom dropdown React cho phép style hoàn toàn, thêm icon, animation, checkmark.

**Q: `useRef` khác `useState` thế nào?**
A: `useRef` lưu giá trị mà không trigger re-render khi thay đổi. Dùng để trỏ đến DOM element (như `ref={timeDropRef}`) hoặc lưu giá trị giữa các render mà không cần re-render. `useState` trigger re-render mỗi khi set.

**Q: `useEffect` với `return` để làm gì?**
A: `return () => removeEventListener(...)` là cleanup function — chạy khi component unmount hoặc trước lần chạy effect tiếp theo. Nếu không cleanup, event listener cũ tích lũy → memory leak và bugs.

**Q: Tại sao `Array(5).fill(tour.image)` thay vì viết `[tour.image, tour.image, ...]`?**
A: Cách viết ngắn gọn hơn. `Array(n)` tạo mảng n phần tử rỗng, `.fill(val)` điền giá trị vào tất cả. Sản phẩm thực sẽ có mảng ảnh riêng từ API.

**Q: `{i === 4 && <div>overlay</div>}` — tại sao dùng `&&` thay `if`?**
A: Trong JSX không dùng được `if` trực tiếp (JSX là expression, không phải statement). Dùng `&&` (short-circuit evaluation): nếu vế trái là `true` → render vế phải; nếu `false` → không render gì.

**Q: `clamp()` trong CSS là gì?**
A: `clamp(min, ideal, max)` = giá trị không thấp hơn min, không cao hơn max, lý tưởng là `ideal`. Giúp responsive font mà không cần media query: `clamp(1.4rem, 3vw, 2rem)` = trên màn hình nhỏ là 1.4rem, lớn nhất là 2rem.

**Q: Tại sao `transform: scale(1.04)` chứ không phải 1.1 hay 1.2?**
A: 1.04 là phóng to nhẹ 4% — đủ để người dùng thấy có phản hồi hover nhưng không quá lố. 1.1 (10%) sẽ cắt ảnh nhiều ở biên, trông không tự nhiên.

**Q: Overlay `.td-gallery-more` dùng `inset: 0` là gì?**
A: `inset` là shorthand cho `top: 0; right: 0; bottom: 0; left: 0;` — phủ đầy element cha. Yêu cầu cha phải có `position: relative`.
