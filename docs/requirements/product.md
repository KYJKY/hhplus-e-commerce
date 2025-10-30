# 상품관리 (Product) 도메인

## 개요
상품관리 도메인은 이커머스에서 판매하는 상품의 정보와 재고를 관리하는 도메인입니다.
의류 판매 이커머스를 기준으로 하며, 상품은 여러 옵션(사이즈, 색상 등)을 가질 수 있습니다.

---

## 주요 기능

### 1. 상품 조회
- 상품 목록을 조회할 수 있습니다.
- 상품 상세 정보를 조회할 수 있습니다.
- 카테고리별로 상품을 필터링할 수 있습니다.

### 2. 상품 옵션 관리
- 상품은 여러 개의 옵션을 가질 수 있습니다 (예: 사이즈, 색상).
- 각 옵션별로 가격과 재고가 독립적으로 관리됩니다.

### 3. 재고 관리
- 상품 옵션별 재고를 실시간으로 조회할 수 있습니다.
- 주문 시 재고가 차감됩니다.
- 재고 부족 시 주문이 불가능합니다.

### 4. 인기 상품 통계
- 최근 3일간 판매량 기준 상위 5개 상품을 조회할 수 있습니다.

---

## 상세 요구사항

### FR-P-001: 상품 목록 조회
**설명**: 상품 목록을 조회합니다.

**입력**:
- categoryId (number, 선택): 카테고리 ID
- page (number, 선택): 페이지 번호 (기본값: 1)
- size (number, 선택): 페이지 크기 (기본값: 20)
- sortBy (string, 선택): 정렬 기준 (newest, popular, price_low, price_high)

**출력**:
- products: 상품 목록
  - productId: 상품 ID
  - productName: 상품명
  - thumbnailUrl: 썸네일 이미지 URL
  - minPrice: 최저 가격 (옵션 중 최저가)
  - maxPrice: 최고 가격 (옵션 중 최고가)
  - viewCount: 조회수
  - categories: 카테고리 목록
- totalCount: 전체 상품 수
- currentPage: 현재 페이지
- totalPages: 전체 페이지 수

**비즈니스 규칙**:
- 삭제된 상품(deleted_at이 NULL이 아닌 경우)은 조회되지 않습니다.
- 비활성화된 상품(is_active=false)은 조회되지 않습니다.
- 정렬 기준:
  - newest: 최신 등록순
  - popular: 조회수 높은 순
  - price_low: 낮은 가격순
  - price_high: 높은 가격순

**예외 처리**:
- `CATEGORY_NOT_FOUND`: 카테고리를 찾을 수 없음

---

### FR-P-002: 상품 상세 조회
**설명**: 특정 상품의 상세 정보를 조회합니다.

**입력**:
- productId (number, 필수): 상품 ID

**출력**:
- productId: 상품 ID
- productName: 상품명
- productDescription: 상품 설명
- thumbnailUrl: 썸네일 이미지 URL
- isActive: 판매 활성화 여부
- viewCount: 조회수
- categories: 카테고리 목록
  - categoryId: 카테고리 ID
  - categoryName: 카테고리명
- options: 상품 옵션 목록
  - optionId: 옵션 ID
  - optionName: 옵션명
  - optionDescription: 옵션 설명
  - price: 가격
  - stockQuantity: 재고 수량
  - isAvailable: 판매 가능 여부
- createdAt: 등록일시

**비즈니스 규칙**:
- 상품 조회 시 조회수가 1 증가합니다.
- 삭제된 상품은 조회할 수 없습니다.
- 판매 불가능한 옵션(isAvailable=false)도 표시되지만, 구매는 불가능합니다.

**예외 처리**:
- `PRODUCT_NOT_FOUND`: 상품을 찾을 수 없음
- `PRODUCT_DELETED`: 삭제된 상품

---

### FR-P-003: 상품 옵션 조회
**설명**: 특정 상품의 옵션 목록을 조회합니다.

**입력**:
- productId (number, 필수): 상품 ID

**출력**:
- productId: 상품 ID
- productName: 상품명
- options: 옵션 목록
  - optionId: 옵션 ID
  - optionName: 옵션명
  - optionDescription: 옵션 설명
  - price: 가격
  - stockQuantity: 재고 수량
  - isAvailable: 판매 가능 여부

**비즈니스 규칙**:
- 모든 옵션(판매 가능/불가능)이 조회됩니다.

**예외 처리**:
- `PRODUCT_NOT_FOUND`: 상품을 찾을 수 없음

---

### FR-P-004: 상품 옵션 상세 조회
**설명**: 특정 상품 옵션의 상세 정보를 조회합니다.

**입력**:
- productId (number, 필수): 상품 ID
- optionId (number, 필수): 옵션 ID

**출력**:
- optionId: 옵션 ID
- productId: 상품 ID
- productName: 상품명
- optionName: 옵션명
- optionDescription: 옵션 설명
- price: 가격
- stockQuantity: 재고 수량
- isAvailable: 판매 가능 여부

**비즈니스 규칙**:
- 해당 상품에 속하지 않은 옵션 ID인 경우 에러를 반환합니다.

**예외 처리**:
- `PRODUCT_NOT_FOUND`: 상품을 찾을 수 없음
- `OPTION_NOT_FOUND`: 옵션을 찾을 수 없음
- `OPTION_NOT_BELONG_TO_PRODUCT`: 옵션이 해당 상품에 속하지 않음

---

### FR-P-005: 재고 확인
**설명**: 상품 옵션의 재고를 확인합니다.

**입력**:
- optionId (number, 필수): 옵션 ID
- quantity (number, 필수): 확인할 수량

**출력**:
- optionId: 옵션 ID
- productId: 상품 ID
- productName: 상품명
- optionName: 옵션명
- currentStock: 현재 재고 수량
- requestedQuantity: 요청 수량
- isAvailable: 재고 충분 여부

**비즈니스 규칙**:
- 현재 재고가 요청 수량보다 크거나 같으면 isAvailable=true
- 옵션이 판매 불가능(isAvailable=false)한 경우 재고와 관계없이 isAvailable=false

**예외 처리**:
- `OPTION_NOT_FOUND`: 옵션을 찾을 수 없음

---

### FR-P-006: 재고 차감 (내부 API)
**설명**: 주문 확정 시 재고를 차감합니다.

**입력**:
- optionId (number, 필수): 옵션 ID
- quantity (number, 필수): 차감할 수량
- orderId (number, 필수): 주문 ID (이력 관리용)

**출력**:
- optionId: 옵션 ID
- previousStock: 차감 전 재고
- deductedQuantity: 차감 수량
- currentStock: 차감 후 재고

**비즈니스 규칙**:
- 재고가 부족한 경우 차감이 실패합니다.
- 재고 차감은 원자적으로 처리되어야 합니다 (동시성 제어 필요).
- 재고 차감 시 `stock_quantity = stock_quantity - quantity` 형태로 처리하여 동시성 문제를 방지합니다.

**예외 처리**:
- `OPTION_NOT_FOUND`: 옵션을 찾을 수 없음
- `INSUFFICIENT_STOCK`: 재고 부족
- `INVALID_QUANTITY`: 유효하지 않은 수량 (0 이하)

---

### FR-P-007: 재고 복원 (내부 API)
**설명**: 주문 취소 또는 결제 실패 시 재고를 복원합니다.

**입력**:
- optionId (number, 필수): 옵션 ID
- quantity (number, 필수): 복원할 수량
- orderId (number, 필수): 주문 ID (이력 관리용)

**출력**:
- optionId: 옵션 ID
- previousStock: 복원 전 재고
- restoredQuantity: 복원 수량
- currentStock: 복원 후 재고

**비즈니스 규칙**:
- 재고 복원은 즉시 반영됩니다.
- 복원 수량은 양수여야 합니다.

**예외 처리**:
- `OPTION_NOT_FOUND`: 옵션을 찾을 수 없음
- `INVALID_QUANTITY`: 유효하지 않은 수량 (0 이하)

---

### FR-P-008: 인기 상품 조회 (Top 5)
**설명**: 최근 3일간 판매량 기준 상위 5개 상품을 조회합니다.

**입력**:
- 없음

**출력**:
- period: 집계 기간
- products: 인기 상품 목록
  - rank: 순위
  - productId: 상품 ID
  - productName: 상품명
  - thumbnailUrl: 썸네일 이미지 URL
  - salesCount: 판매 수량
  - salesAmount: 판매 금액

**비즈니스 규칙**:
- 최근 3일간 완료된 주문의 order_items를 집계합니다.
- 판매 수량 기준으로 내림차순 정렬하여 상위 5개를 반환합니다.
- 동일 판매 수량인 경우 판매 금액이 높은 순으로 정렬합니다.

**예외 처리**:
- 없음 (결과가 없는 경우 빈 배열 반환)

---

### FR-P-009: 카테고리 목록 조회
**설명**: 활성화된 카테고리 목록을 조회합니다.

**입력**:
- 없음

**출력**:
- categories: 카테고리 목록
  - categoryId: 카테고리 ID
  - categoryName: 카테고리명
  - displayOrder: 표시 순서
  - productCount: 해당 카테고리의 상품 수

**비즈니스 규칙**:
- 활성화된 카테고리(is_active=true)만 조회됩니다.
- displayOrder 오름차순으로 정렬됩니다.

**예외 처리**:
- 없음 (결과가 없는 경우 빈 배열 반환)

---

### FR-P-010: 카테고리별 상품 수 조회
**설명**: 특정 카테고리에 속한 상품의 개수를 조회합니다.

**입력**:
- categoryId (number, 필수): 카테고리 ID

**출력**:
- categoryId: 카테고리 ID
- categoryName: 카테고리명
- productCount: 상품 개수

**비즈니스 규칙**:
- 활성화되고 삭제되지 않은 상품만 카운트됩니다.

**예외 처리**:
- `CATEGORY_NOT_FOUND`: 카테고리를 찾을 수 없음

---

## 비즈니스 규칙 요약

### 상품 관리 규칙
1. Products와 ProductOptions는 1:N 관계입니다.
2. Products와 Categories는 N:M 관계입니다 (product_categories 중간 테이블).
3. 상품은 최소 1개 이상의 옵션을 가져야 합니다.
4. 삭제된 상품(deleted_at != NULL)은 조회되지 않습니다.
5. 비활성화된 상품(is_active=false)은 일반 사용자에게 노출되지 않습니다.

### 재고 관리 규칙
1. 재고는 상품 옵션(ProductOptions) 단위로 관리됩니다.
2. 재고 차감은 주문 확정 시점에 이루어집니다.
3. 재고 차감/복원은 원자적으로 처리되어야 합니다 (동시성 제어).
4. 재고가 0이어도 상품은 조회 가능하지만, 주문은 불가능합니다.
5. 옵션이 판매 불가능(isAvailable=false)한 경우 재고와 관계없이 주문 불가능합니다.

### 가격 관리 규칙
1. 가격은 상품 옵션별로 다를 수 있습니다.
2. 주문 시점의 가격이 order_items에 스냅샷으로 저장됩니다.
3. 상품 가격 변경 시 기존 주문에는 영향을 주지 않습니다.

### 동시성 제어
- 재고 차감 시 동시성 문제 방지를 위해 아래 방식 중 하나를 사용합니다:
  - 비관적 락 (Pessimistic Lock): `SELECT ... FOR UPDATE`
  - 낙관적 락 (Optimistic Lock): 버전 컬럼 사용
  - 원자적 업데이트: `UPDATE ... SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?`

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| P001 | PRODUCT_NOT_FOUND | 상품을 찾을 수 없음 |
| P002 | PRODUCT_DELETED | 삭제된 상품 |
| P003 | OPTION_NOT_FOUND | 옵션을 찾을 수 없음 |
| P004 | OPTION_NOT_BELONG_TO_PRODUCT | 옵션이 해당 상품에 속하지 않음 |
| P005 | INSUFFICIENT_STOCK | 재고 부족 |
| P006 | INVALID_QUANTITY | 유효하지 않은 수량 |
| P007 | CATEGORY_NOT_FOUND | 카테고리를 찾을 수 없음 |
| P008 | OPTION_NOT_AVAILABLE | 판매 불가능한 옵션 |