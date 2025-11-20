CREATE TABLE users
(
  id             BIGINT        NOT NULL AUTO_INCREMENT COMMENT '유저 ID',
  login_id       VARCHAR(50)   NOT NULL COMMENT '로그인 아이디',
  login_password VARCHAR(255)  NOT NULL COMMENT '로그인 비밀번호 (해시)',
  email          VARCHAR(100)  NOT NULL COMMENT '이메일',
  name           VARCHAR(50)   NOT NULL COMMENT '유저 성함',
  display_name   VARCHAR(50)   NULL     COMMENT '유저 닉네임',
  phone_number   VARCHAR(20)   NULL     COMMENT '전화번호',
  point          DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '포인트 잔액',
  last_login_at  DATETIME      NULL     COMMENT '마지막 로그인 일',
  deleted_at     DATETIME      NULL     COMMENT '계정 삭제일',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id)
) COMMENT '유저';

ALTER TABLE users
  ADD CONSTRAINT UQ_login_id UNIQUE (login_id);

ALTER TABLE users
  ADD CONSTRAINT UQ_email UNIQUE (email);

CREATE TABLE user_address
(
  id                   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '유저 배송지 ID',
  user_id              BIGINT       NOT NULL COMMENT '유저 ID',
  recipient_name       VARCHAR(50)  NOT NULL COMMENT '수령인 이름',
  recipient_phone      VARCHAR(20)  NOT NULL COMMENT '수령인 연락처',
  postal_code          VARCHAR(10)  NOT NULL COMMENT '우편번호',
  address_default_text VARCHAR(200) NOT NULL COMMENT '기본 주소',
  address_detail_text  VARCHAR(200) NULL     COMMENT '상세 주소',
  is_default           BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '기본 배송지 여부',
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id)
) COMMENT '유저 배송지';

CREATE TABLE categories
(
  id            BIGINT      NOT NULL AUTO_INCREMENT COMMENT '카테고리 ID',
  category_name VARCHAR(50) NOT NULL COMMENT '카테고리명',
  display_order INT         NOT NULL DEFAULT 0 COMMENT '표시 순서',
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE COMMENT '활성화 여부',
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id)
) COMMENT '카테고리';

CREATE TABLE products
(
  id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '상품 ID',
  product_name        VARCHAR(200) NOT NULL COMMENT '상품명',
  product_description TEXT         NULL     COMMENT '상품 설명',
  thumbnail_url       VARCHAR(500) NULL     COMMENT '썸네일 이미지 URL',
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE COMMENT '판매 활성화 여부',
  view_count          BIGINT       NOT NULL DEFAULT 0 COMMENT '조회수',
  deleted_at          DATETIME     NULL     COMMENT '삭제일',
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id)
) COMMENT '상품';

CREATE TABLE product_options
(
  id                 BIGINT        NOT NULL AUTO_INCREMENT COMMENT '상품 옵션 ID',
  product_id         BIGINT        NOT NULL COMMENT '상품 ID',
  option_name        VARCHAR(100)  NOT NULL COMMENT '옵션명',
  option_description VARCHAR(500)  NULL     COMMENT '옵션 설명',
  price_amount       DECIMAL(15,2) NOT NULL COMMENT '가격',
  stock_quantity     INT           NOT NULL DEFAULT 0 COMMENT '재고 수량',
  is_available       BOOLEAN       NOT NULL DEFAULT TRUE COMMENT '판매 가능 여부',
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id),
  INDEX idx_product_id (product_id)
) COMMENT '상품 옵션';

CREATE TABLE product_categories
(
  product_id    BIGINT NOT NULL COMMENT '상품 ID',
  categories_id BIGINT NOT NULL COMMENT '카테고리 ID',
  PRIMARY KEY (product_id, categories_id),
  INDEX idx_categories_id (categories_id)
) COMMENT '상품-카테고리 조인 테이블';

CREATE TABLE cart_items
(
  id                BIGINT   NOT NULL AUTO_INCREMENT COMMENT '장바구니 항목 ID',
  user_id           BIGINT   NOT NULL COMMENT '유저 ID',
  product_id        BIGINT   NOT NULL COMMENT '상품 ID',
  product_option_id BIGINT   NOT NULL COMMENT '상품 옵션 ID',
  quantity          INT      NOT NULL DEFAULT 1 COMMENT '상품 수량',
  deleted_at        DATETIME NULL     COMMENT '삭제일 (논리적 삭제)',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id),
  UNIQUE INDEX UQ_user_product_option (user_id, product_option_id),
  INDEX idx_user_id (user_id),
  INDEX idx_product_option_id (product_option_id)
) COMMENT '장바구니';

CREATE TABLE coupons
(
  id                  BIGINT        NOT NULL AUTO_INCREMENT COMMENT '쿠폰 ID',
  coupon_name         VARCHAR(100)  NOT NULL COMMENT '쿠폰명',
  coupon_code         VARCHAR(50)   NOT NULL COMMENT '쿠폰 코드',
  coupon_description  VARCHAR(500)  NULL     COMMENT '쿠폰 설명',
  discount_rate       DECIMAL(5,2)  NOT NULL COMMENT '할인율 (%)',
  max_discount_amount DECIMAL(15,2) NULL     COMMENT '최대 할인 금액',
  min_order_amount    DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '최소 주문 금액',
  issue_limit         INT           NOT NULL COMMENT '발급 한도',
  issued_count        INT           NOT NULL DEFAULT 0 COMMENT '현재 발급 수량',
  valid_from          DATETIME      NOT NULL COMMENT '유효 시작 일시',
  valid_until         DATETIME      NOT NULL COMMENT '유효 종료 일시',
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE COMMENT '활성화 여부',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id)
) COMMENT '쿠폰';

ALTER TABLE coupons
  ADD CONSTRAINT UQ_coupon_code UNIQUE (coupon_code);

CREATE TABLE user_coupons
(
  id            BIGINT      NOT NULL AUTO_INCREMENT COMMENT '사용자 쿠폰 ID',
  user_id       BIGINT      NOT NULL COMMENT '유터 ID',
  coupon_id     BIGINT      NOT NULL COMMENT '쿠폰 ID',
  status        VARCHAR(20) NOT NULL DEFAULT 'UNUSED' COMMENT '쿠폰 상태 (UNUSED, USED, EXPIRED)',
  issued_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급 일시',
  used_at       DATETIME    NULL     COMMENT '사용 일시',
  used_order_id BIGINT      NULL     COMMENT '사용된 주문 ID',
  PRIMARY KEY (id),
  UNIQUE INDEX UQ_user_coupon (user_id, coupon_id),
  INDEX idx_user_id (user_id),
  INDEX idx_coupon_id (coupon_id),
  INDEX idx_status (status)
) COMMENT '사용자 쿠폰 발급 내역';

CREATE TABLE orders
(
  id                      BIGINT        NOT NULL AUTO_INCREMENT COMMENT '주문 ID',
  user_id                 BIGINT        NOT NULL COMMENT '유저 ID',
  order_number            VARCHAR(50)   NOT NULL COMMENT '주문번호 (ORD-YYYYMMDD-####)',
  order_status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING' COMMENT '주문 상태 (PENDING, PAID, COMPLETED, FAILED, CANCELLED)',
  recipient_name          VARCHAR(50)   NOT NULL COMMENT '수령인 이름',
  recipient_phone         VARCHAR(20)   NOT NULL COMMENT '수령인 연락처',
  shipping_postal_code    VARCHAR(10)   NOT NULL COMMENT '우편번호',
  shipping_address        VARCHAR(200)  NOT NULL COMMENT '배송 주소',
  shipping_address_detail VARCHAR(200)  NULL     COMMENT '배송 상세 주소',
  subtotal_amount         DECIMAL(15,2) NOT NULL COMMENT '상품 금액 합계',
  discount_amount         DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '할인 금액',
  total_amount            DECIMAL(15,2) NOT NULL COMMENT '최종 결제 금액',
  applied_coupon_id       BIGINT        NULL     COMMENT '적용된 쿠폰 ID',
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '주문 생성 일시',
  paid_at                 DATETIME      NULL     COMMENT '결제 완료 일시',
  completed_at            DATETIME      NULL     COMMENT '주문 완료 일시',
  updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id),
  UNIQUE INDEX UQ_order_number (order_number),
  INDEX idx_user_id (user_id),
  INDEX idx_order_status (order_status),
  INDEX idx_created_at (created_at)
) COMMENT '주문';

CREATE TABLE order_items
(
  id                BIGINT        NOT NULL AUTO_INCREMENT COMMENT '주문 항목 ID',
  order_id          BIGINT        NOT NULL COMMENT '주문 ID',
  product_id        BIGINT        NOT NULL COMMENT '상품 ID',
  product_option_id BIGINT        NOT NULL COMMENT '상품 옵션 ID',
  product_name      VARCHAR(200)  NOT NULL COMMENT '상품명 (스냅샷)',
  option_name       VARCHAR(100)  NOT NULL COMMENT '옵션명 (스냅샷)',
  quantity          INT           NOT NULL COMMENT '상품 수량',
  unit_price        DECIMAL(15,2) NOT NULL COMMENT '단가 (주문 시점 가격)',
  subtotal          DECIMAL(15,2) NOT NULL COMMENT '소계',
  PRIMARY KEY (id),
  INDEX idx_order_id (order_id),
  INDEX idx_product_option_id (product_option_id)
) COMMENT '주문 상품';

CREATE TABLE payments
(
  id             BIGINT        NOT NULL AUTO_INCREMENT COMMENT '결제 ID',
  order_id       BIGINT        NOT NULL COMMENT '주문 ID',
  user_id        BIGINT        NOT NULL COMMENT '유저 ID',
  payment_method VARCHAR(20)   NOT NULL DEFAULT 'POINT' COMMENT '결제 수단',
  payment_status VARCHAR(20)   NOT NULL DEFAULT 'SUCCESS' COMMENT '결제 상태 (SUCCESS, FAILED, CANCELLED)',
  paid_amount    DECIMAL(15,2) NOT NULL COMMENT '결제 금액',
  failure_reason VARCHAR(500)  NULL     COMMENT '실패 사유',
  paid_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '결제 일시',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id),
  UNIQUE INDEX UQ_order_id (order_id),
  INDEX idx_user_id (user_id),
  INDEX idx_payment_status (payment_status)
) COMMENT '결제';

CREATE TABLE point_transactions
(
  id               BIGINT        NOT NULL AUTO_INCREMENT COMMENT '포인트 거래 ID',
  user_id          BIGINT        NOT NULL COMMENT '유저 ID',
  transaction_type VARCHAR(20)   NOT NULL COMMENT '거래 유형 (CHARGE, USE, REFUND)',
  amount           DECIMAL(15,2) NOT NULL COMMENT '거래 금액',
  balance_after    DECIMAL(15,2) NOT NULL COMMENT '거래 후 잔액',
  related_order_id BIGINT        NULL     COMMENT '관련 주문 ID',
  description      VARCHAR(500)  NULL     COMMENT '거래 설명',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '거래 일시',
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) COMMENT '포인트 거래 내역';

CREATE TABLE data_transmissions
(
  id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '전송 ID',
  order_id            BIGINT       NOT NULL COMMENT '주문 ID',
  transmission_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT '전송 상태 (PENDING, SUCCESS, FAILED)',
  retry_count         INT          NOT NULL DEFAULT 0 COMMENT '재시도 횟수',
  transmitted_at      DATETIME     NULL     COMMENT '전송 성공 일시',
  failure_reason      VARCHAR(500) NULL     COMMENT '실패 사유',
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (id),
  INDEX idx_order_id (order_id),
  INDEX idx_transmission_status (transmission_status)
) COMMENT '외부 데이터 전송 내역';