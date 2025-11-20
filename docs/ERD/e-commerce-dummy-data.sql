-- =============================================
-- E-Commerce Dummy Data Script
-- =============================================
-- This script inserts minimal test data for API testing
-- Execute this after running e-commerce-ddl-251105.sql
-- =============================================

-- Clear existing data
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM data_transmissions;
DELETE FROM point_transactions;
DELETE FROM payments;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM user_coupons;
DELETE FROM cart_items;
DELETE FROM product_categories;
DELETE FROM product_options;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM coupons;
DELETE FROM user_address;
DELETE FROM users;

-- Reset auto increment
ALTER TABLE data_transmissions AUTO_INCREMENT = 1;
ALTER TABLE point_transactions AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE user_coupons AUTO_INCREMENT = 1;
ALTER TABLE cart_items AUTO_INCREMENT = 1;
ALTER TABLE product_options AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE coupons AUTO_INCREMENT = 1;
ALTER TABLE user_address AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- Users (5 users)
-- =============================================
INSERT INTO users (id, login_id, login_password, email, name, display_name, phone_number, point, last_login_at)
VALUES
  (1, 'user001', '$2b$10$abcdefghijklmnopqrstuv', 'user001@example.com', '김철수', '철수', '010-1234-5678', 100000.00, NOW()),
  (2, 'user002', '$2b$10$abcdefghijklmnopqrstuv', 'user002@example.com', '이영희', '영희', '010-2345-6789', 50000.00, NOW()),
  (3, 'user003', '$2b$10$abcdefghijklmnopqrstuv', 'user003@example.com', '박민수', '민수', '010-3456-7890', 200000.00, NOW()),
  (4, 'user004', '$2b$10$abcdefghijklmnopqrstuv', 'user004@example.com', '최지은', '지은', '010-4567-8901', 0.00, NOW()),
  (5, 'user005', '$2b$10$abcdefghijklmnopqrstuv', 'user005@example.com', '정현우', '현우', '010-5678-9012', 500000.00, NOW());

-- =============================================
-- User Addresses
-- =============================================
INSERT INTO user_address (id, user_id, recipient_name, recipient_phone, postal_code, address_default_text, address_detail_text, is_default)
VALUES
  (1, 1, '김철수', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '삼성빌딩 101호', TRUE),
  (2, 2, '이영희', '010-2345-6789', '13529', '경기도 성남시 분당구 판교역로 234', '판교아파트 201호', TRUE),
  (3, 3, '박민수', '010-3456-7890', '48058', '부산광역시 해운대구 해운대해변로 345', '해운대타워 301호', TRUE),
  (4, 1, '김철수(회사)', '010-1234-5678', '06234', '서울특별시 강남구 역삼로 456', 'IT빌딩 5층', FALSE);

-- =============================================
-- Categories (4 categories)
-- =============================================
INSERT INTO categories (id, category_name, display_order, is_active)
VALUES
  (1, '상의', 1, TRUE),
  (2, '하의', 2, TRUE),
  (3, '아우터', 3, TRUE),
  (4, '액세서리', 4, TRUE);

-- =============================================
-- Products (6 products)
-- =============================================
INSERT INTO products (id, product_name, product_description, thumbnail_url, is_active, view_count)
VALUES
  (1, '베이직 라운드 티셔츠', '심플한 디자인의 베이직 라운드넥 티셔츠입니다.', 'https://example.com/img/tshirt-001.jpg', TRUE, 150),
  (2, '슬림핏 청바지', '편안한 착용감의 슬림핏 청바지입니다.', 'https://example.com/img/jeans-001.jpg', TRUE, 200),
  (3, '후드 집업', '따뜻한 기모 안감의 후드 집업입니다.', 'https://example.com/img/hoodie-001.jpg', TRUE, 89),
  (4, '와이드 슬랙스', '모던한 실루엣의 와이드 슬랙스입니다.', 'https://example.com/img/slacks-001.jpg', TRUE, 120),
  (5, '레더 자켓', '고급 가죽 소재의 라이더 자켓입니다.', 'https://example.com/img/jacket-001.jpg', TRUE, 67),
  (6, '캔버스 백팩', '데일리로 활용하기 좋은 캔버스 백팩입니다.', 'https://example.com/img/backpack-001.jpg', TRUE, 95);

-- =============================================
-- Product Options (각 상품마다 2-3개 옵션)
-- =============================================
INSERT INTO product_options (id, product_id, option_name, option_description, price_amount, stock_quantity, is_available)
VALUES
  -- 티셔츠 옵션
  (1, 1, '화이트 / M', 'M 사이즈 화이트', 29000.00, 50, TRUE),
  (2, 1, '화이트 / L', 'L 사이즈 화이트', 29000.00, 30, TRUE),
  (3, 1, '블랙 / M', 'M 사이즈 블랙', 29000.00, 45, TRUE),
  (4, 1, '블랙 / L', 'L 사이즈 블랙', 29000.00, 0, FALSE),

  -- 청바지 옵션
  (5, 2, '인디고 / 30', '30 인치 인디고', 79000.00, 25, TRUE),
  (6, 2, '인디고 / 32', '32 인치 인디고', 79000.00, 40, TRUE),
  (7, 2, '블랙 / 30', '30 인치 블랙', 79000.00, 15, TRUE),

  -- 후드 집업 옵션
  (8, 3, '그레이 / M', 'M 사이즈 그레이', 89000.00, 20, TRUE),
  (9, 3, '그레이 / L', 'L 사이즈 그레이', 89000.00, 18, TRUE),
  (10, 3, '네이비 / L', 'L 사이즈 네이비', 89000.00, 12, TRUE),

  -- 슬랙스 옵션
  (11, 4, '베이지 / M', 'M 사이즈 베이지', 69000.00, 30, TRUE),
  (12, 4, '베이지 / L', 'L 사이즈 베이지', 69000.00, 25, TRUE),

  -- 레더 자켓 옵션
  (13, 5, '블랙 / M', 'M 사이즈 블랙', 299000.00, 10, TRUE),
  (14, 5, '블랙 / L', 'L 사이즈 블랙', 299000.00, 8, TRUE),
  (15, 5, '브라운 / L', 'L 사이즈 브라운', 299000.00, 5, TRUE),

  -- 백팩 옵션
  (16, 6, '네이비 / ONE SIZE', '네이비 원사이즈', 49000.00, 60, TRUE),
  (17, 6, '베이지 / ONE SIZE', '베이지 원사이즈', 49000.00, 35, TRUE);

-- =============================================
-- Product Categories (상품-카테고리 매핑)
-- =============================================
INSERT INTO product_categories (product_id, categories_id)
VALUES
  (1, 1),  -- 티셔츠 - 상의
  (2, 2),  -- 청바지 - 하의
  (3, 1),  -- 후드 - 상의
  (3, 3),  -- 후드 - 아우터
  (4, 2),  -- 슬랙스 - 하의
  (5, 3),  -- 자켓 - 아우터
  (6, 4);  -- 백팩 - 액세서리

-- =============================================
-- Coupons (4 coupons)
-- =============================================
INSERT INTO coupons (id, coupon_name, coupon_code, coupon_description, discount_rate, max_discount_amount, min_order_amount, issue_limit, issued_count, valid_from, valid_until, is_active)
VALUES
  (1, '신규회원 10% 할인', 'WELCOME10', '신규회원 가입 환영 쿠폰', 10.00, 10000.00, 30000.00, 1000, 150, '2024-01-01 00:00:00', '2025-12-31 23:59:59', TRUE),
  (2, 'VIP 20% 할인', 'VIP20', 'VIP 회원 전용 할인 쿠폰', 20.00, 50000.00, 100000.00, 500, 80, '2024-01-01 00:00:00', '2025-12-31 23:59:59', TRUE),
  (3, '주말특가 15%', 'WEEKEND15', '주말 한정 특가 쿠폰', 15.00, 20000.00, 50000.00, 2000, 450, '2024-01-01 00:00:00', '2025-12-31 23:59:59', TRUE),
  (4, '만료된 쿠폰', 'EXPIRED', '테스트용 만료 쿠폰', 5.00, 5000.00, 10000.00, 100, 50, '2023-01-01 00:00:00', '2023-12-31 23:59:59', FALSE);

-- =============================================
-- User Coupons (사용자별 쿠폰 발급)
-- =============================================
INSERT INTO user_coupons (id, user_id, coupon_id, status, issued_at, used_at, used_order_id)
VALUES
  (1, 1, 1, 'UNUSED', '2024-01-15 10:00:00', NULL, NULL),
  (2, 1, 3, 'UNUSED', '2024-02-01 14:30:00', NULL, NULL),
  (3, 2, 1, 'UNUSED', '2024-01-20 11:00:00', NULL, NULL),
  (4, 3, 2, 'UNUSED', '2024-01-25 09:00:00', NULL, NULL),
  (5, 3, 3, 'USED', '2024-02-05 16:00:00', '2024-02-10 10:30:00', 1),
  (6, 5, 1, 'UNUSED', '2024-02-15 12:00:00', NULL, NULL),
  (7, 5, 2, 'UNUSED', '2024-02-15 12:00:00', NULL, NULL);

-- =============================================
-- Cart Items (장바구니)
-- =============================================
INSERT INTO cart_items (id, user_id, product_id, product_option_id, quantity)
VALUES
  (1, 1, 1, 1, 2),  -- user001: 티셔츠 화이트/M 2개
  (2, 1, 6, 16, 1), -- user001: 백팩 네이비 1개
  (3, 2, 2, 5, 1),  -- user002: 청바지 인디고/30 1개
  (4, 2, 3, 8, 1),  -- user002: 후드 그레이/M 1개
  (5, 4, 1, 3, 3),  -- user004: 티셔츠 블랙/M 3개
  (6, 4, 4, 11, 2); -- user004: 슬랙스 베이지/M 2개

-- =============================================
-- Orders (주문 내역)
-- =============================================
INSERT INTO orders (id, user_id, order_number, order_status, recipient_name, recipient_phone, shipping_postal_code, shipping_address, shipping_address_detail, subtotal_amount, discount_amount, total_amount, applied_coupon_id, created_at, paid_at, completed_at)
VALUES
  (1, 3, 'ORD-20240210-0001', 'COMPLETED', '박민수', '010-3456-7890', '48058', '부산광역시 해운대구 해운대해변로 345', '해운대타워 301호', 168000.00, 25200.00, 142800.00, 3, '2024-02-10 10:00:00', '2024-02-10 10:30:00', '2024-02-15 18:00:00'),
  (2, 1, 'ORD-20240215-0001', 'PAID', '김철수', '010-1234-5678', '06234', '서울특별시 강남구 테헤란로 123', '삼성빌딩 101호', 79000.00, 0.00, 79000.00, NULL, '2024-02-15 14:00:00', '2024-02-15 14:05:00', NULL),
  (3, 5, 'ORD-20240220-0001', 'PENDING', '정현우', '010-5678-9012', '06234', '서울특별시 강남구 역삼로 456', 'IT빌딩 5층', 368000.00, 0.00, 368000.00, NULL, '2024-02-20 09:00:00', NULL, NULL);

-- =============================================
-- Order Items (주문 상품)
-- =============================================
INSERT INTO order_items (id, order_id, product_id, product_option_id, product_name, option_name, quantity, unit_price, subtotal)
VALUES
  -- Order 1: user003
  (1, 1, 2, 5, '슬림핏 청바지', '인디고 / 30', 1, 79000.00, 79000.00),
  (2, 1, 3, 8, '후드 집업', '그레이 / M', 1, 89000.00, 89000.00),

  -- Order 2: user001
  (3, 2, 2, 6, '슬림핏 청바지', '인디고 / 32', 1, 79000.00, 79000.00),

  -- Order 3: user005 (pending)
  (4, 3, 5, 13, '레더 자켓', '블랙 / M', 1, 299000.00, 299000.00),
  (5, 3, 4, 11, '와이드 슬랙스', '베이지 / M', 1, 69000.00, 69000.00);

-- =============================================
-- Payments (결제 내역)
-- =============================================
INSERT INTO payments (id, order_id, user_id, payment_method, payment_status, paid_amount, failure_reason, paid_at)
VALUES
  (1, 1, 3, 'POINT', 'SUCCESS', 142800.00, NULL, '2024-02-10 10:30:00'),
  (2, 2, 1, 'POINT', 'SUCCESS', 79000.00, NULL, '2024-02-15 14:05:00');

-- =============================================
-- Point Transactions (포인트 거래 내역)
-- =============================================
INSERT INTO point_transactions (id, user_id, transaction_type, amount, balance_after, related_order_id, description, created_at)
VALUES
  -- user001 충전 및 사용
  (1, 1, 'CHARGE', 200000.00, 200000.00, NULL, '포인트 충전', '2024-01-15 10:00:00'),
  (2, 1, 'USE', -79000.00, 121000.00, 2, '주문 결제', '2024-02-15 14:05:00'),
  (3, 1, 'CHARGE', 50000.00, 171000.00, NULL, '포인트 충전', '2024-02-18 11:00:00'),
  (4, 1, 'USE', -71000.00, 100000.00, NULL, '주문 결제', '2024-02-20 15:00:00'),

  -- user002 충전
  (5, 2, 'CHARGE', 50000.00, 50000.00, NULL, '포인트 충전', '2024-01-20 12:00:00'),

  -- user003 충전 및 사용
  (6, 3, 'CHARGE', 300000.00, 300000.00, NULL, '포인트 충전', '2024-01-25 09:30:00'),
  (7, 3, 'USE', -142800.00, 157200.00, 1, '주문 결제', '2024-02-10 10:30:00'),
  (8, 3, 'CHARGE', 100000.00, 257200.00, NULL, '포인트 충전', '2024-02-12 14:00:00'),
  (9, 3, 'USE', -57200.00, 200000.00, NULL, '주문 결제', '2024-02-18 16:30:00'),

  -- user005 충전
  (10, 5, 'CHARGE', 500000.00, 500000.00, NULL, '포인트 충전', '2024-02-15 10:00:00');

-- =============================================
-- Data Transmissions (외부 데이터 전송)
-- =============================================
INSERT INTO data_transmissions (id, order_id, transmission_status, retry_count, transmitted_at, failure_reason)
VALUES
  (1, 1, 'SUCCESS', 0, '2024-02-10 10:30:15', NULL),
  (2, 2, 'SUCCESS', 0, '2024-02-15 14:05:10', NULL);

-- =============================================
-- Verification Queries (Optional)
-- =============================================
-- SELECT 'Users:', COUNT(*) FROM users;
-- SELECT 'User Addresses:', COUNT(*) FROM user_address;
-- SELECT 'Categories:', COUNT(*) FROM categories;
-- SELECT 'Products:', COUNT(*) FROM products;
-- SELECT 'Product Options:', COUNT(*) FROM product_options;
-- SELECT 'Coupons:', COUNT(*) FROM coupons;
-- SELECT 'User Coupons:', COUNT(*) FROM user_coupons;
-- SELECT 'Cart Items:', COUNT(*) FROM cart_items;
-- SELECT 'Orders:', COUNT(*) FROM orders;
-- SELECT 'Order Items:', COUNT(*) FROM order_items;
-- SELECT 'Payments:', COUNT(*) FROM payments;
-- SELECT 'Point Transactions:', COUNT(*) FROM point_transactions;
-- SELECT 'Data Transmissions:', COUNT(*) FROM data_transmissions;
