-- ============================================================
--  DAYTRIP – DB Fix Script
--  Chạy toàn bộ file này trong MySQL Workbench (Ctrl+Shift+Enter)
-- ============================================================

USE daytrip_db;

-- ── Tắt kiểm tra khóa ngoại để DROP không bị chặn ─────────
SET FOREIGN_KEY_CHECKS = 0;

-- ── Fix 1: Tạo lại bảng users ──────────────────────────────
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password      VARCHAR(255),
    phone         VARCHAR(50)  DEFAULT '',
    home_city     VARCHAR(100) DEFAULT '',
    initials      VARCHAR(10)  DEFAULT '',
    role          ENUM('admin','traveler') DEFAULT 'traveler',
    is_locked     BOOLEAN      DEFAULT FALSE,
    is_online     BOOLEAN      DEFAULT FALSE,
    created_at    TIMESTAMP    DEFAULT NOW(),
    updated_at    TIMESTAMP    DEFAULT NOW() ON UPDATE NOW(),
    last_login_at TIMESTAMP    NULL
);

-- ── Fix 2: Cột pay_mode trên orders (bỏ qua nếu đã có) ────
DROP PROCEDURE IF EXISTS sp_fix_orders;
DELIMITER $$
CREATE PROCEDURE sp_fix_orders()
BEGIN
    -- pay_mode
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'daytrip_db'
          AND TABLE_NAME   = 'orders'
          AND COLUMN_NAME  = 'pay_mode'
    ) THEN
        ALTER TABLE orders ADD COLUMN pay_mode VARCHAR(20) DEFAULT 'online' AFTER payment_method;
    END IF;

    -- discount
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'daytrip_db'
          AND TABLE_NAME   = 'orders'
          AND COLUMN_NAME  = 'discount'
    ) THEN
        ALTER TABLE orders ADD COLUMN discount BIGINT DEFAULT 0 AFTER tax;
    END IF;

    -- coupon_code
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'daytrip_db'
          AND TABLE_NAME   = 'orders'
          AND COLUMN_NAME  = 'coupon_code'
    ) THEN
        ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL AFTER discount;
    END IF;

    -- booking_ref
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'daytrip_db'
          AND TABLE_NAME   = 'orders'
          AND COLUMN_NAME  = 'booking_ref'
    ) THEN
        ALTER TABLE orders ADD COLUMN booking_ref VARCHAR(20) NULL AFTER id;
    END IF;

    -- phone
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'daytrip_db'
          AND TABLE_NAME   = 'orders'
          AND COLUMN_NAME  = 'phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN phone VARCHAR(20) NULL;
    END IF;

    -- special_req
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'daytrip_db'
          AND TABLE_NAME   = 'orders'
          AND COLUMN_NAME  = 'special_req'
    ) THEN
        ALTER TABLE orders ADD COLUMN special_req TEXT NULL;
    END IF;

    -- sub_total
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'daytrip_db'
          AND TABLE_NAME   = 'orders'
          AND COLUMN_NAME  = 'sub_total'
    ) THEN
        ALTER TABLE orders ADD COLUMN sub_total BIGINT DEFAULT 0 AFTER total_price;
    END IF;
END$$
DELIMITER ;

CALL sp_fix_orders();
DROP PROCEDURE IF EXISTS sp_fix_orders;

-- ── Bật lại kiểm tra khóa ngoại ───────────────────────────
SET FOREIGN_KEY_CHECKS = 1;

-- ── Kiểm tra kết quả ──────────────────────────────────────
SELECT 'users'  AS tbl, COUNT(*) AS rows_count FROM users
UNION ALL
SELECT 'orders' AS tbl, COUNT(*) AS rows_count FROM orders;

SHOW COLUMNS FROM orders;
