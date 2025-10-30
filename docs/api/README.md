# API 문서

이커머스 백엔드 시스템의 OpenAPI 3.0 스펙 문서입니다.

## 개요

이 디렉토리는 RESTful API의 완전한 스펙을 OpenAPI 3.0 형식으로 정의합니다.
요구사항 문서(`docs/requirements/`)를 기반으로 작성되었으며, 각 API는 기능 요구사항(FR-X-###)과 1:1로 매핑됩니다.

## 파일 구조

```
docs/api/
├── README.md                    # 이 문서
├── openapi.yaml                 # 메인 OpenAPI 스펙 ($ref 참조 방식)
├── openapi-standalone.yaml      # 단일 파일 OpenAPI 스펙 (온라인 에디터용)
├── schemas/                     # 재사용 가능한 스키마 정의
│   ├── common.yaml              # 공통 스키마 (Error, Pagination)
│   ├── product.yaml             # Product 관련 스키마
│   ├── order.yaml               # Order 관련 스키마
│   ├── payment.yaml             # Payment 관련 스키마
│   ├── coupon.yaml              # Coupon 관련 스키마
│   ├── cart.yaml                # Cart 관련 스키마
│   └── user.yaml                # User 관련 스키마
├── paths/                       # API 엔드포인트 정의
│   ├── products.yaml            # /products 관련 경로
│   ├── orders.yaml              # /orders 관련 경로
│   ├── payments.yaml            # /payments 관련 경로
│   ├── coupons.yaml             # /coupons 관련 경로
│   ├── cart.yaml                # /cart 관련 경로
│   └── users.yaml               # /users 관련 경로
└── examples/                    # 응답 예시 데이터
    ├── products/
    ├── orders/
    ├── payments/
    ├── coupons/
    ├── cart/
    └── users/
```

## 사용 방법

### 1. Swagger Editor에서 온라인으로 보기 (추천)

**방법 1: 단일 파일 사용 (openapi-standalone.yaml)**

가장 간편한 방법입니다. 모든 $ref가 해결된 단일 파일을 사용합니다.

1. [Swagger Editor](https://editor.swagger.io/) 접속
2. `openapi-standalone.yaml` 파일 내용을 복사
3. Swagger Editor에 붙여넣기
4. 즉시 API 문서 확인 가능

**방법 2: 참조 방식 사용 (openapi.yaml) - 로컬 개발 환경**

로컬에서 파일을 직접 관리할 때 사용합니다. 모듈화된 구조로 유지보수가 용이합니다.

```bash
# VS Code 확장 프로그램 사용
# 1. "OpenAPI (Swagger) Editor" 확장 설치
# 2. openapi.yaml 파일 열기
# 3. 우클릭 → "Preview Swagger" 선택

# 또는 Swagger UI를 로컬에서 실행
npx @stoplight/elements-dev-portal docs/api/openapi.yaml
```

> **주의**: `openapi.yaml`은 $ref로 다른 파일을 참조하므로, 온라인 Swagger Editor에서는 정상적으로 표시되지 않습니다. 온라인 에디터에서 확인하려면 반드시 `openapi-standalone.yaml`을 사용하세요.

### 2. Mock Server 실행 (로컬 테스트용)

Prism Mock Server가 이미 설치되어 있습니다.

```bash
# Mock Server 실행 (포트 4010)
pnpm run mock
```

**API 테스트 예시**:

```bash
# 1. 상품 목록 조회
curl http://localhost:4010/products

# 2. 상품 상세 조회
curl http://localhost:4010/products/10

# 3. 인기 상품 조회
curl http://localhost:4010/products/popular

# 4. 포인트 잔액 조회 (userId 파라미터 필요)
curl http://localhost:4010/payments/balance?userId=1

# 5. 장바구니 조회 (userId 파라미터 필요)
curl http://localhost:4010/cart?userId=1

# 6. 쿠폰 발급 (userId 파라미터 필요)
curl -X POST -H "Content-Type: application/json" \
     -d '{"couponTypeId": 1, "userId": 1}' \
     http://localhost:4010/coupons/issue
```

**주의사항**:
- 사용자별 API는 userId 쿼리 파라미터 또는 요청 바디로 사용자를 식별합니다
- Mock 서버는 실제 데이터베이스를 사용하지 않고 OpenAPI 스펙의 예시 데이터를 반환합니다
- 동시성 테스트나 상태 변경은 반영되지 않습니다 (Stateless)

### 3. Postman Collection 생성

1. Postman 실행
2. Import → Link 선택
3. OpenAPI 파일 경로 입력
4. 자동으로 Collection 생성됨

### 4. 코드 생성 (선택사항)

OpenAPI Generator를 사용한 클라이언트/서버 코드 생성:

```bash
# TypeScript 클라이언트 생성
npx @openapitools/openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g typescript-axios \
  -o generated/client

# NestJS 서버 스텁 생성
npx @openapitools/openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g nodejs-nestjs-server \
  -o generated/server
```

## API 도메인별 매핑

| 도메인 | OpenAPI 경로 | 요구사항 문서 | 주요 기능 |
|--------|-------------|--------------|----------|
| Product | `/products` | [product.md](../requirements/product.md) | 상품 조회, 재고 확인, 인기 상품 |
| Order | `/orders` | [order.md](../requirements/order.md) | 주문 생성, 조회, 상태 관리 |
| Payment | `/payments` | [payment.md](../requirements/payment.md) | 포인트 충전, 잔액 조회, 내역 |
| Coupon | `/coupons` | [coupon.md](../requirements/coupon.md) | 쿠폰 발급, 조회, 검증 |
| Cart | `/cart` | [cart.md](../requirements/cart.md) | 장바구니 CRUD |
| User | `/users` | [user.md](../requirements/user.md) | 사용자 정보, 배송지 관리 |

## 주요 특징

### 1. 요구사항 기반 설계

각 API는 기능 요구사항(FR)과 1:1 매핑:
```yaml
/products:
  get:
    summary: 상품 목록 조회
    description: |
      **기능 요구사항**: FR-P-001
      **문서**: docs/requirements/product.md
```

### 2. 비즈니스 규칙 명시

API description에 핵심 비즈니스 규칙 포함:
```yaml
/payments/charge:
  post:
    description: |
      포인트를 충전합니다.

      **비즈니스 규칙**:
      - 충전 금액: 1,000원 ~ 1,000,000원
      - 단위: 1,000원 단위만 가능
      - 최대 보유 잔액: 10,000,000원
```

### 3. 에러 코드 문서화

모든 에러 응답에 code와 message 명시:
```yaml
responses:
  '400':
    content:
      application/json:
        examples:
          insufficientInventory:
            value:
              code: "INSUFFICIENT_INVENTORY"
              message: "재고가 부족합니다"
```

### 4. 실제 예시 데이터

실제 비즈니스에 맞는 예시 데이터 제공:
```yaml
example:
  productName: "기본 라운드 티셔츠"
  price: 29000
  categories: ["상의", "티셔츠"]
```

## API 규칙

### URL 규칙
- 리소스는 복수형 사용: `/products`, `/orders`
- 하이픈(-) 사용, 언더스코어(_) 사용 안 함
- 소문자 사용

### HTTP 메서드
- `GET`: 조회
- `POST`: 생성
- `PATCH`: 부분 수정
- `DELETE`: 삭제

### 응답 코드
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `404 Not Found`: 리소스 없음
- `500 Internal Server Error`: 서버 오류

### 페이지네이션
모든 목록 조회 API는 표준 페이지네이션 사용:
```json
{
  "items": [...],
  "totalCount": 100,
  "currentPage": 1,
  "totalPages": 5
}
```

### 에러 응답
표준 에러 형식:
```json
{
  "code": "INSUFFICIENT_INVENTORY",
  "message": "재고가 부족합니다",
  "details": {
    "productId": 123,
    "requestedQuantity": 10,
    "availableQuantity": 5
  }
}
```

## 검증

### 스펙 유효성 검증

```bash
# Swagger CLI로 검증
npx @apidevtools/swagger-cli validate docs/api/openapi.yaml

# Spectral로 린팅
npm install -g @stoplight/spectral-cli
spectral lint docs/api/openapi.yaml
```

## 업데이트 가이드

API 스펙을 수정할 때:

1. **요구사항 문서 먼저 수정**
   - `docs/requirements/[domain].md` 업데이트

2. **스키마 수정**
   - `docs/api/schemas/[domain].yaml` 수정

3. **경로 수정**
   - `docs/api/paths/[domain].yaml` 수정

4. **예시 업데이트**
   - `docs/api/examples/[domain]/` 업데이트

5. **검증**
   - Mock Server로 테스트
   - Postman으로 API 호출 테스트

## 참고 문서

- [OpenAPI 3.0 스펙](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [Prism Mock Server](https://stoplight.io/open-source/prism)
- [요구사항 문서](../requirements/)
- [시퀀스 다이어그램](../sequence-diagram/)
