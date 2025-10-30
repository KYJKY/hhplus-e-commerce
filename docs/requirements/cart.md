# 장바구니 (Cart) 도메인

## 개요
장바구니 도메인은 사용자가 구매하고자 하는 상품을 임시로 담아두는 기능을 제공하는 도메인입니다.
상품 옵션별로 수량을 관리하며, 주문 생성 시 장바구니 항목이 주문으로 전환됩니다.

---

## 주요 기능

### 1. 장바구니 조회
- 사용자의 장바구니 목록을 조회할 수 있습니다.
- 각 항목의 상품 정보, 옵션, 가격, 재고 상태를 확인할 수 있습니다.

### 2. 장바구니 항목 관리
- 상품 옵션을 장바구니에 추가할 수 있습니다.
- 장바구니 항목의 수량을 수정할 수 있습니다.
- 장바구니 항목을 삭제할 수 있습니다.

### 3. 재고 확인
- 장바구니 조회 시 각 항목의 재고 상태를 실시간으로 확인합니다.
- 재고 부족 항목은 주문 시 제외됩니다.

### 4. 주문 전환
- 선택한 장바구니 항목을 주문으로 전환할 수 있습니다.
- 주문 완료 시 해당 항목은 장바구니에서 삭제됩니다.

---

## 상세 요구사항

### FR-C-001: 장바구니 조회
**설명**: 사용자의 장바구니 목록을 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- userId: 사용자 ID
- items: 장바구니 항목 목록
  - cartItemId: 장바구니 항목 ID
  - productId: 상품 ID
  - productName: 상품명
  - thumbnailUrl: 썸네일 이미지 URL
  - optionId: 옵션 ID
  - optionName: 옵션명
  - price: 옵션 가격
  - quantity: 수량
  - subtotal: 소계 (price × quantity)
  - stockQuantity: 현재 재고 수량
  - isAvailable: 구매 가능 여부
  - addedAt: 장바구니 추가 일시
- totalItems: 총 항목 수
- totalAmount: 총 금액

**비즈니스 규칙**:
- 장바구니 조회 시 각 항목의 재고를 실시간으로 확인합니다.
- 재고가 0이거나 옵션이 판매 불가능한 경우 isAvailable=false로 표시됩니다.
- 삭제된 상품이나 옵션은 장바구니에서 자동으로 제외됩니다.
- 가격은 상품 옵션의 현재 가격을 조회하여 표시합니다 (실시간 가격 반영).

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-C-002: 장바구니 항목 추가
**설명**: 상품 옵션을 장바구니에 추가합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- optionId (number, 필수): 상품 옵션 ID
- quantity (number, 필수): 수량

**출력**:
- cartItemId: 생성된 장바구니 항목 ID
- productId: 상품 ID
- productName: 상품명
- optionId: 옵션 ID
- optionName: 옵션명
- price: 옵션 가격
- quantity: 수량
- addedAt: 추가 일시

**비즈니스 규칙**:
- 동일한 상품 옵션이 이미 장바구니에 존재하는 경우, 수량을 증가시킵니다.
- 추가하려는 수량이 재고보다 많은 경우 추가가 불가능합니다.
- 수량은 1 이상 99 이하여야 합니다.
- 장바구니 항목은 최대 20개까지 담을 수 있습니다.
- 판매 불가능한 옵션(isAvailable=false)은 장바구니에 추가할 수 없습니다.
- 삭제된 상품이나 비활성화된 상품의 옵션은 추가할 수 없습니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `OPTION_NOT_FOUND`: 옵션을 찾을 수 없음
- `OPTION_NOT_AVAILABLE`: 판매 불가능한 옵션
- `PRODUCT_NOT_FOUND`: 상품을 찾을 수 없음
- `PRODUCT_NOT_ACTIVE`: 비활성화된 상품
- `INSUFFICIENT_STOCK`: 재고 부족
- `INVALID_QUANTITY`: 유효하지 않은 수량 (1~99)
- `CART_ITEM_LIMIT_EXCEEDED`: 장바구니 최대 항목 수(20개) 초과

---

### FR-C-003: 장바구니 항목 수량 수정
**설명**: 장바구니 항목의 수량을 수정합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- cartItemId (number, 필수): 장바구니 항목 ID
- quantity (number, 필수): 변경할 수량

**출력**:
- cartItemId: 장바구니 항목 ID
- optionId: 옵션 ID
- previousQuantity: 변경 전 수량
- quantity: 변경 후 수량
- price: 옵션 가격
- subtotal: 변경 후 소계
- updatedAt: 수정 일시

**비즈니스 규칙**:
- 수량은 1 이상 99 이하여야 합니다.
- 변경하려는 수량이 재고보다 많은 경우 수정이 불가능합니다.
- 해당 사용자의 장바구니 항목이 아닌 경우 수정이 불가능합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `CART_ITEM_NOT_FOUND`: 장바구니 항목을 찾을 수 없음
- `CART_ITEM_ACCESS_DENIED`: 해당 장바구니 항목에 접근 권한이 없음
- `INSUFFICIENT_STOCK`: 재고 부족
- `INVALID_QUANTITY`: 유효하지 않은 수량 (1~99)

---

### FR-C-004: 장바구니 항목 삭제
**설명**: 장바구니에서 특정 항목을 삭제합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- cartItemId (number, 필수): 장바구니 항목 ID

**출력**:
- success: 삭제 성공 여부
- deletedCartItemId: 삭제된 장바구니 항목 ID

**비즈니스 규칙**:
- 해당 사용자의 장바구니 항목이 아닌 경우 삭제가 불가능합니다.
- 물리적 삭제가 아닌 논리적 삭제(deleted_at 업데이트)로 처리됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `CART_ITEM_NOT_FOUND`: 장바구니 항목을 찾을 수 없음
- `CART_ITEM_ACCESS_DENIED`: 해당 장바구니 항목에 접근 권한이 없음

---

### FR-C-005: 장바구니 선택 항목 삭제
**설명**: 장바구니에서 여러 항목을 한 번에 삭제합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- cartItemIds (array<number>, 필수): 삭제할 장바구니 항목 ID 목록

**출력**:
- success: 삭제 성공 여부
- deletedCount: 삭제된 항목 수
- deletedCartItemIds: 삭제된 장바구니 항목 ID 목록

**비즈니스 규칙**:
- 해당 사용자의 장바구니 항목만 삭제 가능합니다.
- 일부 항목 삭제 실패 시에도 나머지 항목은 정상 삭제됩니다.
- 물리적 삭제가 아닌 논리적 삭제(deleted_at 업데이트)로 처리됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `CART_ITEM_IDS_EMPTY`: 삭제할 항목이 없음

---

### FR-C-006: 장바구니 전체 삭제
**설명**: 사용자의 장바구니 항목을 모두 삭제합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- success: 삭제 성공 여부
- deletedCount: 삭제된 항목 수

**비즈니스 규칙**:
- 해당 사용자의 모든 장바구니 항목이 삭제됩니다.
- 물리적 삭제가 아닌 논리적 삭제(deleted_at 업데이트)로 처리됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-C-007: 장바구니 재고 확인
**설명**: 장바구니 항목의 재고 상태를 확인합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- items: 장바구니 항목별 재고 상태
  - cartItemId: 장바구니 항목 ID
  - optionId: 옵션 ID
  - productName: 상품명
  - optionName: 옵션명
  - requestedQuantity: 요청 수량
  - stockQuantity: 현재 재고 수량
  - isAvailable: 구매 가능 여부
  - reason: 불가능 사유 (재고 부족, 판매 종료 등)
- availableCount: 구매 가능 항목 수
- unavailableCount: 구매 불가능 항목 수

**비즈니스 규칙**:
- 각 항목의 재고를 실시간으로 확인합니다.
- 재고가 부족하거나 옵션이 판매 불가능한 경우 isAvailable=false로 표시됩니다.
- 삭제된 상품이나 옵션은 자동으로 구매 불가능 처리됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-C-008: 장바구니 항목 개수 조회
**설명**: 사용자의 장바구니 항목 개수를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- userId: 사용자 ID
- totalItems: 총 항목 수
- availableItems: 구매 가능 항목 수
- unavailableItems: 구매 불가능 항목 수

**비즈니스 규칙**:
- 논리적으로 삭제되지 않은 항목만 카운트됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-C-009: 장바구니 항목 유효성 검증
**설명**: 주문 생성 전 장바구니 항목의 유효성을 검증합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- cartItemIds (array<number>, 필수): 주문할 장바구니 항목 ID 목록

**출력**:
- isValid: 전체 유효성 여부
- items: 항목별 검증 결과
  - cartItemId: 장바구니 항목 ID
  - optionId: 옵션 ID
  - productName: 상품명
  - optionName: 옵션명
  - quantity: 수량
  - price: 현재 가격
  - isValid: 항목 유효성 여부
  - errors: 오류 목록 (재고 부족, 판매 종료 등)

**비즈니스 규칙**:
- 각 항목의 재고, 판매 가능 상태, 상품/옵션 존재 여부를 확인합니다.
- 모든 항목이 유효한 경우에만 isValid=true입니다.
- 주문 생성 전 반드시 호출되어야 합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `CART_ITEM_IDS_EMPTY`: 검증할 항목이 없음

---

### FR-C-010: 장바구니 → 주문 전환 (내부 API)
**설명**: 주문 완료 후 해당 장바구니 항목을 삭제합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- cartItemIds (array<number>, 필수): 주문으로 전환된 장바구니 항목 ID 목록
- orderId (number, 필수): 생성된 주문 ID (이력 관리용)

**출력**:
- success: 삭제 성공 여부
- deletedCount: 삭제된 항목 수
- orderId: 주문 ID

**비즈니스 규칙**:
- 주문이 성공적으로 생성된 경우에만 호출됩니다.
- 장바구니 항목은 논리적으로 삭제됩니다 (deleted_at 업데이트).
- 삭제 실패 시에도 주문은 유효하게 유지됩니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `CART_ITEM_NOT_FOUND`: 장바구니 항목을 찾을 수 없음

---

## 비즈니스 규칙 요약

### 장바구니 관리 규칙
1. Users와 CartItems는 1:N 관계입니다.
2. ProductOptions와 CartItems는 1:N 관계입니다.
3. 사용자당 장바구니 항목은 최대 20개까지 담을 수 있습니다.
4. 동일한 상품 옵션은 장바구니에 1개만 존재하며, 수량으로 관리됩니다.
5. 장바구니 항목의 수량은 1 이상 99 이하여야 합니다.

### 재고 연동 규칙
1. 장바구니 추가/수정 시 재고를 확인합니다.
2. 장바구니 조회 시 실시간 재고 상태를 표시합니다.
3. 재고가 부족하거나 옵션이 판매 불가능한 경우 주문이 불가능합니다.
4. 장바구니에 담긴 것만으로는 재고가 차감되지 않습니다.

### 가격 관리 규칙
1. 장바구니 조회 시 항상 최신 가격을 표시합니다.
2. 주문 시점의 가격이 최종 결제 금액으로 사용됩니다.
3. 장바구니에 담은 시점의 가격과 주문 시점의 가격이 다를 수 있습니다.

### 데이터 정합성 규칙
1. 삭제된 상품이나 옵션은 장바구니 조회 시 자동으로 제외됩니다.
2. 비활성화된 상품의 옵션은 구매 불가능으로 표시됩니다.
3. 장바구니 항목 삭제는 논리적 삭제(soft delete)로 처리됩니다.

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| C001 | USER_NOT_FOUND | 사용자를 찾을 수 없음 |
| C002 | CART_ITEM_NOT_FOUND | 장바구니 항목을 찾을 수 없음 |
| C003 | CART_ITEM_ACCESS_DENIED | 해당 장바구니 항목에 접근 권한이 없음 |
| C004 | OPTION_NOT_FOUND | 옵션을 찾을 수 없음 |
| C005 | OPTION_NOT_AVAILABLE | 판매 불가능한 옵션 |
| C006 | PRODUCT_NOT_FOUND | 상품을 찾을 수 없음 |
| C007 | PRODUCT_NOT_ACTIVE | 비활성화된 상품 |
| C008 | INSUFFICIENT_STOCK | 재고 부족 |
| C009 | INVALID_QUANTITY | 유효하지 않은 수량 (1~99) |
| C010 | CART_ITEM_LIMIT_EXCEEDED | 장바구니 최대 항목 수(20개) 초과 |
| C011 | CART_ITEM_IDS_EMPTY | 처리할 항목이 없음 |