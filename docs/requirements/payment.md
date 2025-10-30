# 결제 (Payment) 도메인

## 개요
결제 도메인은 사용자의 주문에 대한 결제를 처리하고 포인트(잔액)를 관리하는 도메인입니다.
실제 PG사 연동 대신 포인트 충전 및 차감 방식으로 결제를 구현합니다.

---

## 주요 기능

### 1. 포인트 조회
- 사용자의 현재 포인트 잔액을 조회할 수 있습니다.
- 포인트 사용 내역을 조회할 수 있습니다.

### 2. 포인트 충전
- 사용자가 포인트를 충전할 수 있습니다.
- 충전 내역이 기록됩니다.

### 3. 결제 처리
- 주문에 대한 결제를 처리합니다.
- 사용자의 포인트를 차감합니다.
- 결제 내역을 기록합니다.

### 4. 결제 내역 관리
- 결제 성공/실패 내역을 조회할 수 있습니다.
- 환불 처리 시 포인트를 복원합니다 (1차 범위 제외).

---

## 상세 요구사항

### FR-PAY-001: 포인트 잔액 조회
**설명**: 사용자의 현재 포인트 잔액을 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- userId: 사용자 ID
- balance: 현재 포인트 잔액
- lastUpdatedAt: 마지막 업데이트 일시

**비즈니스 규칙**:
- 포인트 잔액은 실시간으로 조회됩니다.
- 음수 잔액은 허용되지 않습니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `POINT_ACCOUNT_NOT_FOUND`: 포인트 계정을 찾을 수 없음

---

### FR-PAY-002: 포인트 충전
**설명**: 사용자의 포인트를 충전합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- amount (number, 필수): 충전할 포인트 금액

**출력**:
- pointTransactionId: 포인트 거래 ID
- userId: 사용자 ID
- amount: 충전 금액
- previousBalance: 충전 전 잔액
- currentBalance: 충전 후 잔액
- transactionType: 거래 유형 (CHARGE)
- createdAt: 충전 일시

**비즈니스 규칙**:
- 충전 금액은 1,000원 이상 1,000,000원 이하여야 합니다.
- 충전 금액은 1,000원 단위여야 합니다.
- 최대 보유 가능 포인트는 10,000,000원입니다.
- 충전 시 포인트 거래 내역이 생성됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `INVALID_CHARGE_AMOUNT`: 유효하지 않은 충전 금액 (1,000~1,000,000원)
- `CHARGE_AMOUNT_UNIT_ERROR`: 충전 금액이 1,000원 단위가 아님
- `MAX_BALANCE_EXCEEDED`: 최대 보유 가능 포인트 초과

---

### FR-PAY-003: 포인트 사용 내역 조회
**설명**: 사용자의 포인트 사용 내역을 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- transactionType (string, 선택): 거래 유형 필터 (CHARGE, USE, REFUND)
- startDate (date, 선택): 조회 시작 일자
- endDate (date, 선택): 조회 종료 일자
- page (number, 선택): 페이지 번호 (기본값: 1)
- size (number, 선택): 페이지 크기 (기본값: 20)

**출력**:
- transactions: 포인트 거래 내역 목록
  - pointTransactionId: 거래 ID
  - transactionType: 거래 유형 (CHARGE, USE, REFUND)
  - amount: 금액
  - balance: 거래 후 잔액
  - relatedOrderId: 관련 주문 ID (있는 경우)
  - description: 거래 설명
  - createdAt: 거래 일시
- totalCount: 전체 거래 수
- currentPage: 현재 페이지
- totalPages: 전체 페이지 수

**비즈니스 규칙**:
- 최신 거래가 먼저 표시됩니다 (createdAt 내림차순).
- 필터가 없으면 모든 거래를 조회합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `INVALID_DATE_RANGE`: 유효하지 않은 날짜 범위

---

### FR-PAY-004: 결제 처리 (내부 API)
**설명**: 주문에 대한 결제를 처리하고 포인트를 차감합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- orderId (number, 필수): 주문 ID
- amount (number, 필수): 결제 금액

**출력**:
- paymentId: 생성된 결제 ID
- orderId: 주문 ID
- userId: 사용자 ID
- amount: 결제 금액
- paymentMethod: 결제 수단 (POINT)
- previousBalance: 결제 전 잔액
- currentBalance: 결제 후 잔액
- status: 결제 상태 (SUCCESS)
- paidAt: 결제 완료 일시

**비즈니스 규칙**:
- 사용자의 포인트 잔액이 결제 금액보다 크거나 같아야 합니다.
- 결제 처리는 원자적으로 이루어집니다 (트랜잭션).
- 결제 성공 시 포인트가 즉시 차감됩니다.
- 동일한 주문에 대해 중복 결제가 불가능합니다.
- 결제 시 포인트 거래 내역(USE)이 생성됩니다.
- 결제 금액은 1원 이상이어야 합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `INSUFFICIENT_BALANCE`: 포인트 잔액 부족
- `INVALID_PAYMENT_AMOUNT`: 유효하지 않은 결제 금액 (1원 이상)
- `DUPLICATE_PAYMENT`: 이미 결제된 주문
- `PAYMENT_PROCESSING_ERROR`: 결제 처리 중 오류 발생

---

### FR-PAY-005: 결제 내역 조회
**설명**: 사용자의 결제 내역을 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- status (string, 선택): 결제 상태 필터 (SUCCESS, FAILED, CANCELLED)
- page (number, 선택): 페이지 번호 (기본값: 1)
- size (number, 선택): 페이지 크기 (기본값: 20)

**출력**:
- payments: 결제 내역 목록
  - paymentId: 결제 ID
  - orderId: 주문 ID
  - orderNumber: 주문번호
  - amount: 결제 금액
  - paymentMethod: 결제 수단 (POINT)
  - status: 결제 상태
  - paidAt: 결제 일시
- totalCount: 전체 결제 수
- currentPage: 현재 페이지
- totalPages: 전체 페이지 수

**비즈니스 규칙**:
- 최신 결제가 먼저 표시됩니다 (paidAt 내림차순).
- 상태 필터가 없으면 모든 결제를 조회합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-PAY-006: 결제 상세 조회
**설명**: 특정 결제의 상세 정보를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- paymentId (number, 필수): 결제 ID

**출력**:
- paymentId: 결제 ID
- orderId: 주문 ID
- orderNumber: 주문번호
- userId: 사용자 ID
- amount: 결제 금액
- paymentMethod: 결제 수단 (POINT)
- status: 결제 상태
- paidAt: 결제 일시
- pointTransactionId: 포인트 거래 ID
- failureReason: 실패 사유 (실패한 경우)

**비즈니스 규칙**:
- 해당 사용자의 결제가 아닌 경우 조회가 불가능합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `PAYMENT_NOT_FOUND`: 결제를 찾을 수 없음
- `PAYMENT_ACCESS_DENIED`: 해당 결제에 접근 권한이 없음

---

### FR-PAY-007: 포인트 환불 (내부 API)
**설명**: 주문 취소 또는 환불 시 포인트를 복원합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- orderId (number, 필수): 주문 ID
- paymentId (number, 필수): 결제 ID
- amount (number, 필수): 환불 금액

**출력**:
- pointTransactionId: 포인트 거래 ID
- userId: 사용자 ID
- orderId: 주문 ID
- paymentId: 결제 ID
- amount: 환불 금액
- previousBalance: 환불 전 잔액
- currentBalance: 환불 후 잔액
- transactionType: 거래 유형 (REFUND)
- refundedAt: 환불 일시

**비즈니스 규칙**:
- 환불 금액은 원래 결제 금액과 같아야 합니다.
- 이미 환불된 결제는 재환불이 불가능합니다.
- 환불 시 포인트 거래 내역(REFUND)이 생성됩니다.
- 환불은 즉시 처리됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `PAYMENT_NOT_FOUND`: 결제를 찾을 수 없음
- `ALREADY_REFUNDED`: 이미 환불된 결제
- `INVALID_REFUND_AMOUNT`: 유효하지 않은 환불 금액

**참고**: 이 기능은 1차 개발 범위에서 제외됩니다.

---

### FR-PAY-008: 결제 실패 처리 (내부 API)
**설명**: 결제 실패 시 실패 정보를 기록합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- orderId (number, 필수): 주문 ID
- amount (number, 필수): 시도한 결제 금액
- failureReason (string, 필수): 실패 사유

**출력**:
- paymentId: 생성된 결제 ID
- orderId: 주문 ID
- userId: 사용자 ID
- amount: 결제 금액
- status: 결제 상태 (FAILED)
- failureReason: 실패 사유
- failedAt: 실패 일시

**비즈니스 규칙**:
- 결제 실패 시 주문 상태는 FAILED로 변경됩니다.
- 포인트는 차감되지 않습니다.
- 실패 내역은 데이터베이스에 기록됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음

---

### FR-PAY-009: 포인트 차감 검증 (내부 API)
**설명**: 결제 전 포인트 차감 가능 여부를 검증합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- amount (number, 필수): 차감할 금액

**출력**:
- userId: 사용자 ID
- currentBalance: 현재 잔액
- requestedAmount: 요청 금액
- isAvailable: 차감 가능 여부
- shortage: 부족 금액 (부족한 경우)

**비즈니스 규칙**:
- 현재 잔액이 요청 금액보다 크거나 같으면 isAvailable=true
- 부족한 경우 shortage에 부족 금액을 반환합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `INVALID_AMOUNT`: 유효하지 않은 금액 (1원 이상)

---

### FR-PAY-010: 결제 통계 조회
**설명**: 사용자의 결제 통계를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- userId: 사용자 ID
- totalPayments: 총 결제 건수
- totalAmount: 총 결제 금액
- successfulPayments: 성공한 결제 건수
- failedPayments: 실패한 결제 건수
- averagePaymentAmount: 평균 결제 금액
- lastPaymentAt: 마지막 결제 일시

**비즈니스 규칙**:
- 성공한 결제(SUCCESS)만 통계에 포함됩니다.
- 환불된 결제도 통계에 포함됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

## 비즈니스 규칙 요약

### 포인트 관리 규칙
1. Users와 PointAccounts는 1:1 관계입니다.
2. PointAccounts와 PointTransactions는 1:N 관계입니다.
3. 포인트 잔액은 항상 0 이상이어야 합니다 (음수 불가).
4. 최대 보유 가능 포인트는 10,000,000원입니다.
5. 충전 금액은 1,000원 단위, 1,000원 이상 1,000,000원 이하여야 합니다.

### 결제 처리 규칙
1. Orders와 Payments는 1:1 관계입니다.
2. 결제는 사용자의 포인트 잔액을 기반으로 처리됩니다.
3. 잔액이 부족한 경우 결제가 실패합니다.
4. 결제는 원자적으로 처리되어야 합니다 (트랜잭션).
5. 결제 성공 시 포인트가 즉시 차감됩니다.
6. 동일한 주문에 대해 중복 결제가 불가능합니다.

### 포인트 거래 내역 규칙
1. 모든 포인트 변동은 PointTransactions에 기록됩니다.
2. 거래 유형: CHARGE (충전), USE (사용), REFUND (환불)
3. 각 거래는 거래 전후의 잔액을 기록합니다.
4. 거래 내역은 삭제되지 않습니다 (영구 보관).

### 환불 규칙 (1차 범위 제외)
1. 환불 금액은 원래 결제 금액과 동일해야 합니다.
2. 이미 환불된 결제는 재환불이 불가능합니다.
3. 환불 시 포인트가 즉시 복원됩니다.
4. 환불 내역은 REFUND 거래로 기록됩니다.

### 동시성 제어
- 포인트 차감/충전 시 동시성 문제 방지를 위해 아래 방식 중 하나를 사용합니다
  - 비관적 락 (Pessimistic Lock)
  - 낙관적 락 (Optimistic Lock)

동시성 제어와 관련된 내용은 추후 구현에 따라 변동될 수 있습니다.

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| PAY001 | USER_NOT_FOUND | 사용자를 찾을 수 없음 |
| PAY002 | ORDER_NOT_FOUND | 주문을 찾을 수 없음 |
| PAY003 | PAYMENT_NOT_FOUND | 결제를 찾을 수 없음 |
| PAY004 | PAYMENT_ACCESS_DENIED | 해당 결제에 접근 권한이 없음 |
| PAY005 | POINT_ACCOUNT_NOT_FOUND | 포인트 계정을 찾을 수 없음 |
| PAY006 | INSUFFICIENT_BALANCE | 포인트 잔액 부족 |
| PAY007 | INVALID_PAYMENT_AMOUNT | 유효하지 않은 결제 금액 |
| PAY008 | INVALID_CHARGE_AMOUNT | 유효하지 않은 충전 금액 (1,000~1,000,000원) |
| PAY009 | CHARGE_AMOUNT_UNIT_ERROR | 충전 금액이 1,000원 단위가 아님 |
| PAY010 | MAX_BALANCE_EXCEEDED | 최대 보유 가능 포인트 초과 |
| PAY011 | DUPLICATE_PAYMENT | 이미 결제된 주문 |
| PAY012 | PAYMENT_PROCESSING_ERROR | 결제 처리 중 오류 발생 |
| PAY013 | ALREADY_REFUNDED | 이미 환불된 결제 |
| PAY014 | INVALID_REFUND_AMOUNT | 유효하지 않은 환불 금액 |
| PAY015 | INVALID_AMOUNT | 유효하지 않은 금액 |
| PAY016 | INVALID_DATE_RANGE | 유효하지 않은 날짜 범위 |
