# 프로젝트 문서

이커머스 백엔드 시스템의 설계 및 요구사항 문서입니다.

## 문서 구조

```
docs/
├── README.md                    # 이 문서
├── requirements/                # 도메인별 요구사항 명세
├── ERD/                         # 데이터베이스 설계
├── sequence-diagram/            # 시퀀스 다이어그램
└── flow-chart/                  # 플로우 차트
```

---

## 📋 요구사항 명세 (requirements/)

각 도메인별 상세 기능 요구사항과 비즈니스 규칙을 정의합니다.

### 도메인 문서

| 파일 | 설명 | 주요 기능 |
|------|------|-----------|
| [README.md](requirements/README.md) | 프로젝트 개요 및 이해관계자 | 전체 시스템 개요, 핵심 비즈니스 규칙 |
| [user.md](requirements/user.md) | 사용자 도메인 | 회원 정보, 배송지 관리 |
| [product.md](requirements/product.md) | 상품 도메인 | 상품 조회, 재고 관리, 인기 상품 통계 |
| [cart.md](requirements/cart.md) | 장바구니 도메인 | 장바구니 CRUD, 재고 확인 |
| [order.md](requirements/order.md) | 주문 도메인 | 주문 생성, 상태 관리, 외부 데이터 전송 |
| [payment.md](requirements/payment.md) | 결제(포인트) 도메인 | 포인트 충전/사용, 트랜잭션 관리 |
| [coupon.md](requirements/coupon.md) | 쿠폰 도메인 | 쿠폰 발급, 검증, 사용 |

### 각 문서 포함 내용

- 기능 요구사항 (FR-X-###)
- 비즈니스 규칙 및 검증 로직
- 입력/출력 명세
- 에러 코드 및 예외 처리

---

## 🗄️ ERD (ERD/)

데이터베이스 논리적/물리적 설계 문서입니다.

### 파일 목록

- `e-commerce-erd.erd` - ERD 원본 파일 (ERD Cloud)
- `e-commerce-logical-*.sql` - 논리 스키마 SQL
- `e-commerce-logical-*.png` - ERD 다이어그램 이미지

### 주요 엔티티

- User, UserAddress
- Product, ProductOption, Category
- Cart, CartItem
- Order, OrderItem
- UserPoint, PointTransaction
- CouponType, UserCoupon

---

## 📊 시퀀스 다이어그램 (sequence-diagram/)

시스템 내 주요 상호작용 프로세스를 시간 순서대로 표현합니다.

### 다이어그램 목록

| 파일 | 설명 | 핵심 포인트 |
|------|------|------------|
| [order-payment-process.md](sequence-diagram/order-payment-process.md) | 주문 생성 및 결제 프로세스 | 전체 주문 플로우, 트랜잭션 범위 |
| [inventory-deduction-concurrency.md](sequence-diagram/inventory-deduction-concurrency.md) | 재고 차감 동시성 제어 | 동시 주문 시 재고 보호 |
| [point-charge-process.md](sequence-diagram/point-charge-process.md) | 포인트 충전 프로세스 | 금액 검증, 최대 잔액 확인 |
| [coupon-issuance-process.md](sequence-diagram/coupon-issuance-process.md) | 쿠폰 발급 프로세스 | 선착순 제어, 중복 방지 |

### 다이어그램 특징

- **간결한 개요**: 구현 세부사항 최소화
- **논리적 흐름**: ORM/프로시저 등 구현 방식에 독립적
- **핵심 비즈니스 로직**: 동시성 제어, 트랜잭션 범위 중심

---

## 🔄 플로우 차트 (flow-chart/)

의사결정 분기와 검증 로직을 시각화합니다.

### 차트 목록

| 파일 | 설명 | 핵심 포인트 |
|------|------|------------|
| [order-payment-flow.md](flow-chart/order-payment-flow.md) | 주문 및 결제 플로우 | 검증 단계, 롤백 시나리오 |
| [coupon-issuance-flow.md](flow-chart/coupon-issuance-flow.md) | 쿠폰 발급 플로우 | 검증 조건, 락 획득 순서 |

### 차트 특징

- 조건별 분기 처리 명확화
- 에러 케이스 및 예외 처리 흐름
- 검증 규칙 순서 시각화

---

## 🔑 핵심 비즈니스 규칙

### 재고 관리
- 재고 차감은 **결제 시점**에 발생 (주문 생성 시점 X)
- 동시성 제어를 통한 초과 차감 방지 필수
- 결제 실패 시 즉시 재고 복원

### 포인트 시스템
- 충전: 1,000~1,000,000원 (1,000원 단위)
- 최대 잔액: 10,000,000원
- 모든 포인트 연산은 원자적(atomic) 처리 필요

### 쿠폰 시스템
- 선착순 제한 수량 발급
- 1인 1쿠폰 제한 (동일 타입)
- 1주문 1쿠폰 적용

### 주문 프로세스
- 주문 상태: PENDING → PAID → COMPLETED (단방향)
- 트랜잭션 범위: 주문 생성 ~ 장바구니 삭제
- 외부 데이터 전송 실패해도 주문 완료 처리

---

## 📝 문서 작성 원칙

### 요구사항 문서
- 기능별 고유 ID 부여 (FR-X-###)
- 입력/출력 명세 필수
- 비즈니스 규칙 명확히 정의
- 에러 케이스 문서화

### 다이어그램
- Mermaid 형식 사용 (GitHub 렌더링)
- 간결한 개요 포함
- 구현 세부사항 최소화
- 논리적/개념적 수준 유지

---

## 🛠️ 기술 스택

- **언어**: TypeScript
- **프레임워크**: NestJS
- **데이터베이스**: MySQL 8.0
- **패키지 매니저**: pnpm

자세한 내용은 루트 디렉토리의 [CLAUDE.md](../CLAUDE.md)를 참고하세요.

---

## 📚 추가 참고

- 프로젝트 개발 가이드: [CLAUDE.md](../CLAUDE.md)
- 요구사항 전체 개요: [requirements/README.md](requirements/README.md)
- 시퀀스 다이어그램 가이드: [sequence-diagram/README.md](sequence-diagram/README.md)
- 플로우 차트 가이드: [flow-chart/README.md](flow-chart/README.md)
