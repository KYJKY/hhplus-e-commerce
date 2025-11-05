# 주문 (Order) 도메인

## 개요
주문 도메인은 사용자의 구매 요청을 처리하고 관리하는 도메인입니다.
장바구니 항목을 기반으로 주문을 생성하고, 결제 처리, 재고 차감, 외부 데이터 전송을 포함한 전체 주문 프로세스를 관리합니다.

---

## 주요 기능

### 1. 주문 생성
- 장바구니 항목을 기반으로 주문을 생성할 수 있습니다.
- 재고 확인 후 주문이 생성됩니다.
- 쿠폰을 적용하여 할인된 금액으로 주문할 수 있습니다.

### 2. 주문 조회
- 사용자의 주문 목록을 조회할 수 있습니다.
- 주문 상세 정보를 조회할 수 있습니다.
- 주문 상태별로 필터링할 수 있습니다.

### 3. 주문 상태 관리
- 주문 상태는 PENDING → PAID → COMPLETED 순서로 진행됩니다.
- 결제 실패 시 FAILED 상태로 변경됩니다.
- 주문 취소 시 CANCELLED 상태로 변경됩니다 (1차 범위 제외).

### 4. 외부 데이터 전송
- 주문 완료 후 외부 데이터 플랫폼으로 주문 정보를 전송합니다.
- 전송 실패 시에도 주문은 정상 처리됩니다.

---

## 상세 요구사항

### FR-O-001: 주문 생성
**설명**: 장바구니 항목을 기반으로 주문을 생성합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- cartItemIds (array<number>, 필수): 주문할 장바구니 항목 ID 목록
- addressId (number, 필수): 배송지 ID
- couponId (number, 선택): 적용할 쿠폰 ID

**출력**:
- orderId: 생성된 주문 ID
- userId: 사용자 ID
- orderNumber: 주문번호 (표시용, 예: ORD-20251031-0001)
- items: 주문 항목 목록
  - orderItemId: 주문 항목 ID
  - productId: 상품 ID
  - productName: 상품명
  - optionId: 옵션 ID
  - optionName: 옵션명
  - quantity: 수량
  - unitPrice: 단가 (주문 시점 가격)
  - subtotal: 소계
- shippingAddress: 배송지 정보
  - recipientName: 수령인 이름
  - phoneNumber: 수령인 전화번호
  - zipCode: 우편번호
  - address: 주소
  - detailAddress: 상세 주소
- subtotalAmount: 상품 금액 합계
- discountAmount: 할인 금액
- totalAmount: 최종 결제 금액
- appliedCoupon: 적용된 쿠폰 정보 (없으면 null)
  - couponId: 쿠폰 ID
  - couponName: 쿠폰명
  - discountRate: 할인율
- status: 주문 상태 (PENDING)
- createdAt: 주문 생성 일시

**비즈니스 규칙**:
- 주문 생성 전 모든 항목의 재고를 확인합니다.
- 재고가 부족하거나 판매 불가능한 항목이 있으면 주문 생성이 실패합니다.
- 쿠폰 적용 시 유효성을 검증합니다 (유효기간, 사용 여부, 사용자 소유 여부).
- 쿠폰은 1개만 적용 가능합니다.
- 할인 금액은 상품 금액 합계에만 적용됩니다.
- 주문 생성 시점의 상품 가격이 order_items에 스냅샷으로 저장됩니다.
- 배송지 정보도 주문 시점에 스냅샷으로 저장됩니다.
- 주문 생성 시 주문번호는 `ORD-YYYYMMDD-####` 형식으로 생성됩니다.
- 주문 생성 직후 상태는 PENDING입니다.
- 주문 생성만으로는 재고가 차감되지 않습니다 (결제 완료 시 차감).

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `CART_ITEM_NOT_FOUND`: 장바구니 항목을 찾을 수 없음
- `CART_ITEM_IDS_EMPTY`: 주문할 항목이 없음
- `ADDRESS_NOT_FOUND`: 배송지를 찾을 수 없음
- `ADDRESS_ACCESS_DENIED`: 해당 배송지에 접근 권한이 없음
- `OPTION_NOT_FOUND`: 옵션을 찾을 수 없음
- `OPTION_NOT_AVAILABLE`: 판매 불가능한 옵션
- `INSUFFICIENT_STOCK`: 재고 부족
- `INVALID_COUPON`: 유효하지 않은 쿠폰
- `COUPON_EXPIRED`: 쿠폰이 만료됨
- `COUPON_ALREADY_USED`: 이미 사용된 쿠폰
- `COUPON_NOT_OWNED`: 사용자가 소유하지 않은 쿠폰

---

### FR-O-002: 주문 목록 조회
**설명**: 사용자의 주문 목록을 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- status (string, 선택): 주문 상태 필터 (PENDING, PAID, COMPLETED, FAILED, CANCELLED)
- page (number, 선택): 페이지 번호 (기본값: 1)
- size (number, 선택): 페이지 크기 (기본값: 20)

**출력**:
- orders: 주문 목록
  - orderId: 주문 ID
  - orderNumber: 주문번호
  - totalAmount: 최종 결제 금액
  - status: 주문 상태
  - itemCount: 주문 항목 수
  - createdAt: 주문 생성 일시
  - paidAt: 결제 완료 일시
- totalCount: 전체 주문 수
- currentPage: 현재 페이지
- totalPages: 전체 페이지 수

**비즈니스 규칙**:
- 최신 주문이 먼저 표시됩니다 (createdAt 내림차순).
- 상태 필터가 없으면 모든 주문을 조회합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-O-003: 주문 상세 조회
**설명**: 특정 주문의 상세 정보를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- orderId (number, 필수): 주문 ID

**출력**:
- orderId: 주문 ID
- userId: 사용자 ID
- orderNumber: 주문번호
- items: 주문 항목 목록
  - orderItemId: 주문 항목 ID
  - productId: 상품 ID
  - productName: 상품명
  - thumbnailUrl: 썸네일 이미지 URL
  - optionId: 옵션 ID
  - optionName: 옵션명
  - quantity: 수량
  - unitPrice: 단가
  - subtotal: 소계
- shippingAddress: 배송지 정보
  - recipientName: 수령인 이름
  - phoneNumber: 수령인 전화번호
  - zipCode: 우편번호
  - address: 주소
  - detailAddress: 상세 주소
- subtotalAmount: 상품 금액 합계
- discountAmount: 할인 금액
- totalAmount: 최종 결제 금액
- appliedCoupon: 적용된 쿠폰 정보
  - couponId: 쿠폰 ID
  - couponName: 쿠폰명
  - discountRate: 할인율
- payment: 결제 정보
  - paymentId: 결제 ID
  - paidAmount: 결제 금액
  - paymentMethod: 결제 수단 (POINT)
  - paidAt: 결제 일시
- status: 주문 상태
- createdAt: 주문 생성 일시
- paidAt: 결제 완료 일시
- completedAt: 주문 완료 일시

**비즈니스 규칙**:
- 해당 사용자의 주문이 아닌 경우 조회가 불가능합니다.
- 결제 정보는 결제 완료(PAID) 이후부터 표시됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `ORDER_ACCESS_DENIED`: 해당 주문에 접근 권한이 없음

---

### FR-O-004: 주문 상태 변경 (내부 API)
**설명**: 주문 상태를 변경합니다.

**입력**:
- orderId (number, 필수): 주문 ID
- status (string, 필수): 변경할 상태 (PENDING, PAID, COMPLETED, FAILED, CANCELLED)
- reason (string, 선택): 상태 변경 사유

**출력**:
- orderId: 주문 ID
- previousStatus: 변경 전 상태
- currentStatus: 변경 후 상태
- updatedAt: 상태 변경 일시

**비즈니스 규칙**:
- 주문 상태는 정해진 순서로만 변경 가능합니다:
  - PENDING → PAID → COMPLETED (정상 흐름)
  - PENDING → FAILED (결제 실패)
  - PENDING → CANCELLED (주문 취소, 1차 범위 제외)
- 역방향 상태 변경은 불가능합니다.
- COMPLETED, FAILED, CANCELLED 상태에서는 더 이상 상태 변경이 불가능합니다.

**예외 처리**:
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `INVALID_STATUS_TRANSITION`: 유효하지 않은 상태 전이

---

### FR-O-005: 주문 결제 처리
**설명**: 주문에 대한 결제를 처리합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- orderId (number, 필수): 주문 ID

**출력**:
- orderId: 주문 ID
- paymentId: 생성된 결제 ID
- paidAmount: 결제 금액
- remainingBalance: 잔여 포인트
- status: 주문 상태 (PAID)
- paidAt: 결제 완료 일시
- dataTransmissionStatus: 외부 데이터 전송 상태 (SUCCESS, FAILED, PENDING)

**비즈니스 규칙**:
- 주문 상태가 PENDING인 경우에만 결제가 가능합니다.
- 사용자의 포인트 잔액이 결제 금액보다 크거나 같아야 합니다.
- 결제 처리 순서:
  1. 포인트 차감 (Payment 도메인)
  2. 재고 차감 (Product 도메인)
  3. 쿠폰 사용 처리 (Coupon 도메인, 적용된 경우)
  4. 주문 상태 → PAID
  5. 장바구니 항목 삭제 (Cart 도메인)
  6. 외부 데이터 플랫폼 전송 (비동기)
- 포인트 차감 또는 재고 차감 실패 시 트랜잭션 롤백됩니다.
- 외부 데이터 전송 실패는 주문 완료에 영향을 주지 않습니다.
- 결제 완료 시 paidAt이 기록됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `ORDER_ACCESS_DENIED`: 해당 주문에 접근 권한이 없음
- `INVALID_ORDER_STATUS`: 주문 상태가 결제 가능한 상태가 아님
- `INSUFFICIENT_BALANCE`: 포인트 잔액 부족
- `INSUFFICIENT_STOCK`: 재고 부족 (결제 시점에 재고 부족 발생)
- `PAYMENT_FAILED`: 결제 처리 실패

---

### FR-O-006: 주문 완료 처리 (내부 API)
**설명**: 주문을 완료 상태로 변경합니다.

**입력**:
- orderId (number, 필수): 주문 ID

**출력**:
- orderId: 주문 ID
- status: 주문 상태 (COMPLETED)
- completedAt: 주문 완료 일시

**비즈니스 규칙**:
- 주문 상태가 PAID인 경우에만 완료 처리가 가능합니다.
- 주문 완료는 배송 완료 후 자동으로 처리됩니다 (1차 범위에서는 수동 또는 스케줄러로 처리).
- 주문 완료 시 completedAt이 기록됩니다.

**예외 처리**:
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `INVALID_ORDER_STATUS`: 주문 상태가 완료 가능한 상태가 아님

---

### FR-O-007: 주문 취소 (1차 범위 제외)
**설명**: 주문을 취소합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- orderId (number, 필수): 주문 ID
- reason (string, 필수): 취소 사유

**출력**:
- orderId: 주문 ID
- status: 주문 상태 (CANCELLED)
- cancelledAt: 취소 일시
- refundAmount: 환불 금액

**비즈니스 규칙**:
- 주문 상태가 PENDING인 경우에만 취소가 가능합니다.
- 결제 완료(PAID) 이후 취소는 환불 프로세스가 필요합니다 (1차 범위 제외).
- 취소 시 처리 순서:
  1. 주문 상태 → CANCELLED
  2. 재고 복원 (결제 완료된 경우)
  3. 포인트 환불 (결제 완료된 경우)
  4. 쿠폰 복원 (사용된 경우)

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `ORDER_ACCESS_DENIED`: 해당 주문에 접근 권한이 없음
- `ORDER_CANNOT_BE_CANCELLED`: 취소 불가능한 주문 상태

**참고**: 이 기능은 1차 개발 범위에서 제외됩니다.

---

### FR-O-008: 외부 데이터 전송 (내부 API)
**설명**: 주문 데이터를 외부 데이터 플랫폼으로 전송합니다.

**입력**:
- orderId (number, 필수): 주문 ID

**출력**:
- orderId: 주문 ID
- transmissionStatus: 전송 상태 (SUCCESS, FAILED)
- transmittedAt: 전송 일시
- failureReason: 실패 사유 (실패 시)

**비즈니스 규칙**:
- 주문 결제 완료(PAID) 후 비동기로 호출됩니다.
- 전송 실패 시 재시도 로직이 있어야 합니다 (최대 3회).
- 전송 실패해도 주문은 정상 처리됩니다.
- 전송 데이터 형식:
  - 주문 ID, 주문번호, 사용자 ID
  - 주문 항목 목록 (상품ID, 수량, 금액)
  - 총 결제 금액, 할인 금액
  - 주문 일시, 결제 일시

**예외 처리**:
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `EXTERNAL_API_ERROR`: 외부 API 호출 실패 (재시도 대상)

---

### FR-O-009: 주문 통계 조회
**설명**: 사용자의 주문 통계를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- userId: 사용자 ID
- totalOrders: 총 주문 수
- completedOrders: 완료된 주문 수
- totalSpent: 총 구매 금액
- averageOrderAmount: 평균 주문 금액
- mostOrderedProducts: 자주 구매한 상품 (상위 5개)
  - productId: 상품 ID
  - productName: 상품명
  - orderCount: 주문 횟수

**비즈니스 규칙**:
- COMPLETED 상태의 주문만 통계에 포함됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-O-010: 주문 항목별 재고 차감 (내부 API)
**설명**: 주문 항목별로 재고를 차감합니다.

**입력**:
- orderId (number, 필수): 주문 ID

**출력**:
- orderId: 주문 ID
- deductedItems: 차감된 항목 목록
  - orderItemId: 주문 항목 ID
  - optionId: 옵션 ID
  - quantity: 차감 수량
  - success: 차감 성공 여부

**비즈니스 규칙**:
- 결제 처리 중 호출됩니다.
- 모든 항목의 재고 차감이 성공해야 합니다.
- 하나라도 실패하면 전체 트랜잭션이 롤백됩니다.
- Product 도메인의 재고 차감 API를 호출합니다.

**예외 처리**:
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `INSUFFICIENT_STOCK`: 재고 부족
- `STOCK_DEDUCTION_FAILED`: 재고 차감 실패

---

## 비즈니스 규칙 요약

### 주문 생성 규칙
1. Users와 Orders는 1:N 관계입니다.
2. Orders와 OrderItems는 1:N 관계입니다.
3. ProductOptions와 OrderItems는 1:N 관계입니다.
4. 주문 생성 시 상품 가격과 배송지 정보가 스냅샷으로 저장됩니다.
5. 주문 번호는 `ORD-YYYYMMDD-####` 형식으로 생성됩니다.
6. 쿠폰은 주문당 1개만 적용 가능합니다.

### 주문 상태 관리 규칙
1. 주문 상태: PENDING → PAID → COMPLETED (정상 흐름)
2. 결제 실패: PENDING → FAILED
3. 주문 취소: PENDING → CANCELLED (1차 범위 제외)
4. 상태 역전은 불가능합니다 (단방향 전이).
5. COMPLETED, FAILED, CANCELLED 상태는 최종 상태입니다.

### 결제 처리 규칙
1. 결제는 PENDING 상태에서만 가능합니다.
2. 결제 처리 순서: 포인트 차감 → 재고 차감 → 쿠폰 사용 → 상태 변경(PAID) → 장바구니 삭제 → 외부 전송
3. 포인트 또는 재고 차감 실패 시 전체 트랜잭션이 롤백됩니다.
4. 외부 데이터 전송 실패는 주문에 영향을 주지 않습니다.

### 재고 관리 규칙
1. 재고는 주문 생성 시점이 아닌 결제 완료 시점에 차감됩니다.
2. 결제 실패 또는 주문 취소 시 재고가 복원됩니다.
3. 재고 차감은 원자적으로 처리되어야 합니다 (동시성 제어).

### 외부 연동 규칙
1. 외부 데이터 전송은 비동기로 처리됩니다.
2. 전송 실패 시 최대 3회 재시도합니다.
3. 전송 실패해도 주문은 정상 처리됩니다.
4. 전송 상태는 별도로 관리됩니다 (SUCCESS, FAILED, PENDING).

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| O001 | USER_NOT_FOUND | 사용자를 찾을 수 없음 |
| O002 | ORDER_NOT_FOUND | 주문을 찾을 수 없음 |
| O003 | ORDER_ACCESS_DENIED | 해당 주문에 접근 권한이 없음 |
| O004 | CART_ITEM_NOT_FOUND | 장바구니 항목을 찾을 수 없음 |
| O005 | CART_ITEM_IDS_EMPTY | 주문할 항목이 없음 |
| O006 | ADDRESS_NOT_FOUND | 배송지를 찾을 수 없음 |
| O007 | ADDRESS_ACCESS_DENIED | 해당 배송지에 접근 권한이 없음 |
| O008 | OPTION_NOT_FOUND | 옵션을 찾을 수 없음 |
| O009 | OPTION_NOT_AVAILABLE | 판매 불가능한 옵션 |
| O010 | INSUFFICIENT_STOCK | 재고 부족 |
| O011 | INVALID_COUPON | 유효하지 않은 쿠폰 |
| O012 | COUPON_EXPIRED | 쿠폰이 만료됨 |
| O013 | COUPON_ALREADY_USED | 이미 사용된 쿠폰 |
| O014 | COUPON_NOT_OWNED | 사용자가 소유하지 않은 쿠폰 |
| O015 | INVALID_ORDER_STATUS | 유효하지 않은 주문 상태 |
| O016 | INVALID_STATUS_TRANSITION | 유효하지 않은 상태 전이 |
| O017 | INSUFFICIENT_BALANCE | 포인트 잔액 부족 |
| O018 | PAYMENT_FAILED | 결제 처리 실패 |
| O019 | ORDER_CANNOT_BE_CANCELLED | 취소 불가능한 주문 상태 |
| O020 | STOCK_DEDUCTION_FAILED | 재고 차감 실패 |
| O021 | EXTERNAL_API_ERROR | 외부 API 호출 실패 |