-- ============================================================
--  DAYTRIP – Thêm bảng room_reservations
--  Mục đích: Chống đặt phòng trùng khi 2 user cùng đặt 1 phòng
--  Chạy trong MySQL Workbench: Ctrl+Shift+Enter
-- ============================================================

USE daytrip_db;

-- Tạo bảng giữ chỗ tạm thời
CREATE TABLE IF NOT EXISTS room_reservations (
    id          VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),

    -- Phòng nào, khách sạn nào
    hotel_id    VARCHAR(50)  NOT NULL,
    room_id     VARCHAR(50)  NOT NULL,

    -- Ngày ở
    check_in    DATE         NOT NULL,
    check_out   DATE         NOT NULL,

    -- Ai giữ
    user_id     VARCHAR(36)  NOT NULL,

    -- Trạng thái: holding=đang giữ | confirmed=đã đặt xong | cancelled=đã hủy | expired=hết hạn
    status      ENUM('holding','confirmed','cancelled','expired') NOT NULL DEFAULT 'holding',

    -- Hết hạn sau 10 phút (đồng bộ với countdown trên UI)
    expires_at  DATETIME     NOT NULL,

    created_at  DATETIME     NOT NULL DEFAULT NOW(),

    -- Index để tìm kiếm nhanh khi kiểm tra conflict
    INDEX idx_room_dates   (hotel_id, room_id, check_in, check_out),
    INDEX idx_user         (user_id),
    INDEX idx_expires      (expires_at),
    INDEX idx_status       (status)
);

SELECT 'room_reservations table created/verified ✅' AS result;
SHOW COLUMNS FROM room_reservations;
