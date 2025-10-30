# 쿠폰 (Coupon) 도메인

## 개요
쿠폰 도메인은 할인 쿠폰의 발급, 사용, 검증을 관리하는 도메인입니다.
선착순 한정 수량 쿠폰을 지원하며, 주문 시 할인 적용을 위해 사용됩니다.

---

## 주요 기능

### 1. 쿠폰 조회
- 발급 가능한 쿠폰 목록을 조회할 수 있습니다.
- 사용자가 보유한 쿠폰을 조회할 수 있습니다.
- 쿠폰 상세 정보를 조회할 수 있습니다.

### 2. 쿠폰 발급
- 선착순 한정 수량 쿠폰을 발급받을 수 있습니다.
- 사용자 당 동일 쿠폰은 1회만 발급 가능합니다.
- 발급 수량이 소진되면 발급이 중단됩니다.

### 3. 쿠폰 사용
- 주문 시 쿠폰을 적용하여 할인받을 수 있습니다.
- 쿠폰은 주문당 1개만 적용 가능합니다.
- 사용된 쿠폰은 재사용이 불가능합니다.

### 4. 쿠폰 검증
- 쿠폰의 유효기간, 사용 여부, 소유 여부를 검증합니다.
- 주문 생성 시 쿠폰 유효성을 확인합니다.

---

## 상세 요구사항

### FR-CP-001: 발급 가능 쿠폰 목록 조회
**설명**: 현재 발급 가능한 쿠폰 목록을 조회합니다.

**입력**:
- userId (number, 선택): 사용자 ID (해당 사용자가 발급 가능한 쿠폰만 필터링)

**출력**:
- coupons: 쿠폰 목록
  - couponId: 쿠폰 ID
  - couponName: 쿠폰명
  - couponCode: 쿠폰 코드
  - discountRate: 할인율 (%)
  - maxDiscountAmount: 최대 할인 금액
  - minOrderAmount: 최소 주문 금액
  - issueLimit: 발급 한도
  - issuedCount: 현재 발급 수량
  - remainingCount: 남은 발급 수량
  - validFrom: 유효 시작 일시
  - validUntil: 유효 종료 일시
  - isIssuable: 발급 가능 여부 (userId 제공 시)
- totalCount: 전체 쿠폰 수

**비즈니스 규칙**:
- 유효 기간이 지나지 않은 쿠폰만 조회됩니다.
- 발급 수량이 소진된 쿠폰도 표시되지만 isIssuable=false입니다.
- userId가 제공된 경우, 해당 사용자가 이미 발급받은 쿠폰은 isIssuable=false입니다.
- 비활성화된 쿠폰(is_active=false)은 조회되지 않습니다.

**예외 처리**:
- 없음 (결과가 없는 경우 빈 배열 반환)

---

### FR-CP-002: 보유 쿠폰 목록 조회
**설명**: 사용자가 보유한 쿠폰 목록을 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- status (string, 선택): 쿠폰 상태 필터 (UNUSED, USED, EXPIRED)

**출력**:
- coupons: 보유 쿠폰 목록
  - userCouponId: 사용자 쿠폰 ID
  - couponId: 쿠폰 ID
  - couponName: 쿠폰명
  - couponCode: 쿠폰 코드
  - discountRate: 할인율 (%)
  - maxDiscountAmount: 최대 할인 금액
  - minOrderAmount: 최소 주문 금액
  - validFrom: 유효 시작 일시
  - validUntil: 유효 종료 일시
  - status: 쿠폰 상태 (UNUSED, USED, EXPIRED)
  - issuedAt: 발급 일시
  - usedAt: 사용 일시 (사용된 경우)
  - usedOrderId: 사용된 주문 ID (사용된 경우)
- totalCount: 전체 보유 쿠폰 수
- unusedCount: 미사용 쿠폰 수
- usedCount: 사용된 쿠폰 수
- expiredCount: 만료된 쿠폰 수

**비즈니스 규칙**:
- 최신 발급 쿠폰이 먼저 표시됩니다 (issuedAt 내림차순).
- 유효 기간이 지난 쿠폰은 자동으로 EXPIRED 상태로 표시됩니다.
- 상태 필터가 없으면 모든 쿠폰을 조회합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-CP-003: 쿠폰 상세 조회
**설명**: 특정 쿠폰의 상세 정보를 조회합니다.

**입력**:
- couponId (number, 필수): 쿠폰 ID

**출력**:
- couponId: 쿠폰 ID
- couponName: 쿠폰명
- couponCode: 쿠폰 코드
- couponDescription: 쿠폰 설명
- discountRate: 할인율 (%)
- maxDiscountAmount: 최대 할인 금액
- minOrderAmount: 최소 주문 금액
- issueLimit: 발급 한도
- issuedCount: 현재 발급 수량
- remainingCount: 남은 발급 수량
- validFrom: 유효 시작 일시
- validUntil: 유효 종료 일시
- isActive: 활성화 여부
- createdAt: 생성 일시

**비즈니스 규칙**:
- 비활성화된 쿠폰도 조회 가능합니다.
- 관리자용 API로 활용됩니다.

**예외 처리**:
- `COUPON_NOT_FOUND`: 쿠폰을 찾을 수 없음

---

### FR-CP-004: 쿠폰 발급
**설명**: 사용자에게 쿠폰을 발급합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- couponId (number, 필수): 쿠폰 ID

**출력**:
- userCouponId: 생성된 사용자 쿠폰 ID
- userId: 사용자 ID
- couponId: 쿠폰 ID
- couponName: 쿠폰명
- couponCode: 쿠폰 코드
- discountRate: 할인율 (%)
- maxDiscountAmount: 최대 할인 금액
- minOrderAmount: 최소 주문 금액
- validFrom: 유효 시작 일시
- validUntil: 유효 종료 일시
- status: 쿠폰 상태 (UNUSED)
- issuedAt: 발급 일시

**비즈니스 규칙**:
- 사용자 당 동일 쿠폰은 1회만 발급 가능합니다.
- 발급 수량이 한도에 도달하면 발급이 불가능합니다.
- 유효 기간이 시작되지 않았거나 종료된 쿠폰은 발급이 불가능합니다.
- 비활성화된 쿠폰(is_active=false)은 발급이 불가능합니다.
- 쿠폰 발급은 원자적으로 처리되어야 합니다 (동시성 제어 필요).
- 발급 시 coupons 테이블의 issued_count가 1 증가합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `COUPON_NOT_FOUND`: 쿠폰을 찾을 수 없음
- `COUPON_NOT_ACTIVE`: 비활성화된 쿠폰
- `COUPON_ALREADY_ISSUED`: 이미 발급받은 쿠폰
- `COUPON_ISSUE_LIMIT_EXCEEDED`: 쿠폰 발급 한도 초과
- `COUPON_NOT_STARTED`: 쿠폰 유효 기간이 시작되지 않음
- `COUPON_EXPIRED`: 쿠폰 유효 기간이 종료됨

---

### FR-CP-005: 쿠폰 코드로 발급
**설명**: 쿠폰 코드를 입력하여 쿠폰을 발급받습니다.

**입력**:
- userId (number, 필수): 사용자 ID
- couponCode (string, 필수): 쿠폰 코드

**출력**:
- FR-CP-004와 동일

**비즈니스 규칙**:
- 쿠폰 코드로 쿠폰을 조회하여 발급합니다.
- 나머지 규칙은 FR-CP-004와 동일합니다.

**예외 처리**:
- `INVALID_COUPON_CODE`: 유효하지 않은 쿠폰 코드
- FR-CP-004의 예외 처리와 동일

---

### FR-CP-006: 쿠폰 유효성 검증 (내부 API)
**설명**: 주문 시 쿠폰의 유효성을 검증합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- userCouponId (number, 필수): 사용자 쿠폰 ID
- orderAmount (number, 필수): 주문 금액

**출력**:
- userCouponId: 사용자 쿠폰 ID
- couponId: 쿠폰 ID
- couponName: 쿠폰명
- isValid: 유효성 여부
- discountRate: 할인율 (%)
- discountAmount: 할인 금액
- maxDiscountAmount: 최대 할인 금액
- validationErrors: 검증 오류 목록 (유효하지 않은 경우)

**비즈니스 규칙**:
- 해당 사용자의 쿠폰인지 확인합니다.
- 쿠폰 상태가 UNUSED인지 확인합니다.
- 유효 기간 내인지 확인합니다.
- 최소 주문 금액을 충족하는지 확인합니다.
- 할인 금액은 `orderAmount * (discountRate / 100)` 으로 계산됩니다.
- 할인 금액이 최대 할인 금액을 초과하는 경우 최대 할인 금액으로 제한됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `USER_COUPON_NOT_FOUND`: 사용자 쿠폰을 찾을 수 없음
- `COUPON_ACCESS_DENIED`: 해당 쿠폰에 접근 권한이 없음
- `COUPON_ALREADY_USED`: 이미 사용된 쿠폰
- `COUPON_EXPIRED`: 만료된 쿠폰
- `COUPON_NOT_STARTED`: 유효 기간이 시작되지 않은 쿠폰
- `MIN_ORDER_AMOUNT_NOT_MET`: 최소 주문 금액 미충족

---

### FR-CP-007: 쿠폰 사용 처리 (내부 API)
**설명**: 주문 완료 시 쿠폰을 사용 처리합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- userCouponId (number, 필수): 사용자 쿠폰 ID
- orderId (number, 필수): 주문 ID

**출력**:
- userCouponId: 사용자 쿠폰 ID
- couponId: 쿠폰 ID
- status: 쿠폰 상태 (USED)
- usedAt: 사용 일시
- usedOrderId: 사용된 주문 ID

**비즈니스 규칙**:
- 결제 완료 후 호출됩니다.
- 쿠폰 상태가 UNUSED에서 USED로 변경됩니다.
- 사용 일시(used_at)와 주문 ID(used_order_id)가 기록됩니다.
- 이미 사용된 쿠폰은 재사용이 불가능합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `USER_COUPON_NOT_FOUND`: 사용자 쿠폰을 찾을 수 없음
- `COUPON_ACCESS_DENIED`: 해당 쿠폰에 접근 권한이 없음
- `COUPON_ALREADY_USED`: 이미 사용된 쿠폰

---

### FR-CP-008: 쿠폰 복원 (내부 API)
**설명**: 주문 취소 또는 결제 실패 시 쿠폰을 복원합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- userCouponId (number, 필수): 사용자 쿠폰 ID

**출력**:
- userCouponId: 사용자 쿠폰 ID
- couponId: 쿠폰 ID
- status: 쿠폰 상태 (UNUSED)
- restoredAt: 복원 일시

**비즈니스 규칙**:
- 주문 취소 또는 결제 실패 시 호출됩니다.
- 쿠폰 상태가 USED에서 UNUSED로 변경됩니다.
- used_at과 used_order_id가 NULL로 초기화됩니다.
- 유효 기간이 지난 쿠폰도 복원은 가능하지만 재사용은 불가능합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `USER_COUPON_NOT_FOUND`: 사용자 쿠폰을 찾을 수 없음
- `COUPON_ACCESS_DENIED`: 해당 쿠폰에 접근 권한이 없음
- `COUPON_NOT_USED`: 사용되지 않은 쿠폰 (복원 불가)

**참고**: 이 기능은 1차 개발 범위에서 제외됩니다.

---

### FR-CP-009: 쿠폰 만료 처리 (배치)
**설명**: 유효 기간이 지난 쿠폰을 자동으로 만료 처리합니다.

**입력**:
- 없음 (스케줄러에서 주기적으로 실행)

**출력**:
- expiredCount: 만료 처리된 쿠폰 수
- processedAt: 처리 일시

**비즈니스 규칙**:
- 유효 기간(valid_until)이 현재 시간보다 이전인 쿠폰을 조회합니다.
- 상태가 UNUSED인 쿠폰만 EXPIRED로 변경합니다.
- 이미 사용된(USED) 쿠폰은 만료 처리하지 않습니다.
- 매일 자정에 실행됩니다.

**예외 처리**:
- 없음

---

### FR-CP-010: 쿠폰 통계 조회
**설명**: 특정 쿠폰의 발급 및 사용 통계를 조회합니다.

**입력**:
- couponId (number, 필수): 쿠폰 ID

**출력**:
- couponId: 쿠폰 ID
- couponName: 쿠폰명
- issueLimit: 발급 한도
- issuedCount: 발급 수량
- usedCount: 사용 수량
- expiredCount: 만료 수량
- unusedCount: 미사용 수량
- usageRate: 사용률 (%)
- totalDiscountAmount: 총 할인 금액

**비즈니스 규칙**:
- 사용률은 `(usedCount / issuedCount) * 100` 으로 계산됩니다.
- 총 할인 금액은 실제 사용된 쿠폰의 할인 금액 합계입니다.

**예외 처리**:
- `COUPON_NOT_FOUND`: 쿠폰을 찾을 수 없음

---

## 비즈니스 규칙 요약

### 쿠폰 발급 규칙
1. Coupons와 UserCoupons는 1:N 관계입니다.
2. Users와 UserCoupons는 1:N 관계입니다.
3. 사용자 당 동일 쿠폰은 1회만 발급 가능합니다.
4. 쿠폰 발급은 선착순이며, 발급 한도에 도달하면 발급이 중단됩니다.
5. 발급 한도는 coupons 테이블의 issue_limit으로 관리됩니다.
6. 발급 시 issued_count가 1 증가합니다.

### 쿠폰 사용 규칙
1. Orders와 UserCoupons는 1:1 관계입니다 (주문당 1개 쿠폰).
2. 쿠폰은 UNUSED 상태일 때만 사용 가능합니다.
3. 유효 기간 내의 쿠폰만 사용 가능합니다.
4. 최소 주문 금액을 충족해야 사용 가능합니다.
5. 사용된 쿠폰은 USED 상태로 변경되며 재사용이 불가능합니다.

### 할인 계산 규칙
1. 할인 금액 = 주문 금액 × (할인율 / 100)
2. 할인 금액이 최대 할인 금액을 초과하는 경우 최대 할인 금액으로 제한됩니다.
3. 할인은 상품 금액 합계(subtotal)에만 적용됩니다.
4. 배송비는 할인 대상에 포함되지 않습니다.

### 쿠폰 상태 관리 규칙
1. 쿠폰 상태: UNUSED (미사용), USED (사용), EXPIRED (만료)
2. 발급 시: UNUSED
3. 사용 시: UNUSED → USED
4. 만료 시: UNUSED → EXPIRED (자동)
5. 복원 시: USED → UNUSED (주문 취소 시, 1차 범위 제외)
6. 상태 역전은 복원의 경우에만 가능합니다.

### 동시성 제어
- 쿠폰 발급 시 동시성 문제 방지를 위해 아래 방식 중 하나를 사용합니다:
  - 비관적 락 (Pessimistic Lock): `SELECT ... FOR UPDATE`
  - 낙관적 락 (Optimistic Lock): 버전 컬럼 사용
  - 원자적 업데이트: `UPDATE coupons SET issued_count = issued_count + 1 WHERE id = ? AND issued_count < issue_limit`

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| CP001 | USER_NOT_FOUND | 사용자를 찾을 수 없음 |
| CP002 | COUPON_NOT_FOUND | 쿠폰을 찾을 수 없음 |
| CP003 | USER_COUPON_NOT_FOUND | 사용자 쿠폰을 찾을 수 없음 |
| CP004 | COUPON_ACCESS_DENIED | 해당 쿠폰에 접근 권한이 없음 |
| CP005 | COUPON_NOT_ACTIVE | 비활성화된 쿠폰 |
| CP006 | COUPON_ALREADY_ISSUED | 이미 발급받은 쿠폰 |
| CP007 | COUPON_ISSUE_LIMIT_EXCEEDED | 쿠폰 발급 한도 초과 |
| CP008 | COUPON_NOT_STARTED | 쿠폰 유효 기간이 시작되지 않음 |
| CP009 | COUPON_EXPIRED | 쿠폰 유효 기간이 종료됨 |
| CP010 | COUPON_ALREADY_USED | 이미 사용된 쿠폰 |
| CP011 | MIN_ORDER_AMOUNT_NOT_MET | 최소 주문 금액 미충족 |
| CP012 | INVALID_COUPON_CODE | 유효하지 않은 쿠폰 코드 |
| CP013 | COUPON_NOT_USED | 사용되지 않은 쿠폰 (복원 불가) |
