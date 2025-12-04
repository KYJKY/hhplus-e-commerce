# Redis Key 관리 정책

## 1. 개요

### 1.1 목적
- Redis Key 네이밍 규칙 통일
- 중앙 집중식 Key 관리로 유지보수성 향상
- 일관된 TTL 정책 적용

### 1.2 적용 범위
- 캐싱 (Cache)
- 분산 락 (Distributed Lock)
- 랭킹 (Ranking)
- Pub/Sub 채널
- 임시 키 (Temp)

---

## 2. Key 네이밍 규칙

### 2.1 Key 구조
```
{purpose}:{domain}:{resource}:{identifier}[:{sub-identifier}]
```

| 요소 | 설명 | 예시 |
|------|------|------|
| **purpose** | Redis 사용 용도 | `cache`, `lock`, `ranking`, `pubsub`, `temp` |
| **domain** | 비즈니스 도메인 | `product`, `coupon`, `order`, `user` |
| **resource** | 리소스 유형 | `detail`, `options`, `issue`, `sales` |
| **identifier** | 주 식별자 | `{productId}`, `{couponId}`, `{YYYY-MM-DD}` |
| **sub-identifier** | 부 식별자 (선택) | `{optionId}`, `{userId}` |

### 2.2 Prefix 체계

| Prefix | 용도 | 설명 |
|--------|------|------|
| `cache:` | 캐싱 | 데이터 캐싱 (TTL 기반 자동 만료) |
| `lock:` | 분산 락 | Redlock 분산 락 |
| `ranking:` | 랭킹 | Sorted Set 기반 랭킹 데이터 |
| `pubsub:` | Pub/Sub | 메시지 채널 |
| `temp:` | 임시 | 연산용 임시 키 (짧은 TTL) |

### 2.3 구분자 규칙

| 규칙 | 설명 |
|------|------|
| 계층 구분자 | `:` (콜론) |
| 날짜 포맷 | `YYYY-MM-DD` (ISO 8601 기반) |
| 타임스탬프 | Unix milliseconds |
| UUID | 8자리 short UUID |

---

## 3. 용도별 Key 목록

### 3.1 캐싱 (cache:)

| Key 패턴 | 설명 | 예시 |
|----------|------|------|
| `cache:product:detail:{productId}` | 상품 상세 캐시 | `cache:product:detail:123` |
| `cache:product:options:{productId}` | 상품 옵션 목록 캐시 | `cache:product:options:123` |
| `cache:product:option:{productId}:{optionId}` | 옵션 상세 캐시 | `cache:product:option:123:456` |
| `cache:ranking:popular:{days}` | 인기 상품 캐시 | `cache:ranking:popular:3` |

**사용 위치:**
- `src/modules/product/domain/services/product-query.service.ts`
- `src/modules/product/infrastructure/repositories/redis-product-ranking.repository.ts`

### 3.2 분산 락 (lock:)

| Key 패턴 | 설명 | 예시 |
|----------|------|------|
| `lock:coupon:issue:{couponId}` | 쿠폰 발급 락 | `lock:coupon:issue:123` |
| `lock:order:process:{orderId}` | 주문 처리 락 (예약) | `lock:order:process:456` |
| `lock:product:stock:{optionId}` | 재고 차감 락 (예약) | `lock:product:stock:789` |

**사용 위치:**
- `src/modules/coupon/domain/services/coupon-domain.service.ts`

### 3.3 랭킹 (ranking:)

| Key 패턴 | 데이터 타입 | 설명 | 예시 |
|----------|------------|------|------|
| `ranking:product:sales:{YYYY-MM-DD}` | Sorted Set | 일별 판매 랭킹 | `ranking:product:sales:2025-01-15` |

**사용 위치:**
- `src/modules/product/infrastructure/repositories/redis-product-ranking.repository.ts`

### 3.4 Pub/Sub (pubsub:)

| Key 패턴 | 설명 | 예시 |
|----------|------|------|
| `pubsub:lock:coupon:issue:{couponId}` | 쿠폰 발급 락 해제 알림 | `pubsub:lock:coupon:issue:123` |
| `pubsub:lock:release:{lockKey-encoded}` | 일반 락 해제 알림 | `pubsub:lock:release:lock-coupon-issue-123` |

**사용 위치:**
- `src/common/redis/distributed-lock.service.ts`

### 3.5 임시 키 (temp:)

| Key 패턴 | 설명 | 예시 |
|----------|------|------|
| `temp:ranking:sales:{timestamp}:{uuid}` | 랭킹 합산 연산용 | `temp:ranking:sales:1704067200000:a1b2c3d4` |
| `temp:ranking:rank:{timestamp}:{uuid}` | 순위 조회용 | `temp:ranking:rank:1704067200000:b2c3d4e5` |

**사용 위치:**
- `src/modules/product/infrastructure/repositories/redis-product-ranking.repository.ts`

---

## 4. TTL 정책

### 4.1 캐싱 TTL

| Key 유형 | TTL | 단위 | 근거 |
|----------|-----|------|------|
| 상품 상세 | 30분 | ms | 변경 빈도 낮음, 30분 지연 허용 |
| 상품 옵션 | 30분 | ms | 상품 상세와 동일 정책 |
| 인기 상품 | 5분 | ms | 랭킹 변동 반영 필요 |
| 카테고리 | 1시간 | ms | 거의 변경되지 않음 |

### 4.2 분산 락 TTL

| Key 유형 | TTL | 단위 | 근거 |
|----------|-----|------|------|
| 기본 락 | 3초 | ms | 트랜잭션 시간 고려 |
| 쿠폰 발급 | 3초 | ms | 빠른 락 해제 필요 |
| 재고 차감 | 5초 | ms | 복잡한 연산 고려 |

### 4.3 랭킹/임시 TTL

| Key 유형 | TTL | 단위 | 근거 |
|----------|-----|------|------|
| 일별 판매 데이터 | 7일 | sec | 최근 N일 조회 지원 |
| 연산용 임시 키 | 1분 | sec | 빠른 정리 필요 |

---

## 5. Key 생성 가이드

### 5.1 파일 구조

```
src/common/redis/
├── keys/
│   ├── index.ts              # 모든 키 export
│   ├── redis-key.builder.ts  # 키 생성 유틸리티
│   ├── cache.keys.ts         # 캐싱 키
│   ├── lock.keys.ts          # 분산 락 키
│   ├── ranking.keys.ts       # 랭킹 키
│   ├── pubsub.keys.ts        # Pub/Sub 채널
│   └── temp.keys.ts          # 임시 키
└── ttl/
    ├── index.ts
    └── ttl.config.ts         # TTL 설정
```

### 5.2 사용 예시

```typescript
import {
  ProductCacheKeys,
  CouponLockKeys,
  ProductRankingKeys,
  RedisTTL,
} from 'src/common/redis';

// 캐시 키 생성
const cacheKey = ProductCacheKeys.detail(productId);
// => 'cache:product:detail:123'

// 분산 락 키 생성
const lockKey = CouponLockKeys.issue(couponId);
// => 'lock:coupon:issue:456'

// 일별 랭킹 키 생성
const rankingKey = ProductRankingKeys.dailySales(new Date());
// => 'ranking:product:sales:2025-01-15'

// TTL 사용
const ttl = RedisTTL.CACHE.PRODUCT_DETAIL; // 30분 (ms)
```

### 5.3 새 키 추가 시 가이드

1. 적절한 파일에 키 함수 추가 (`cache.keys.ts`, `lock.keys.ts` 등)
2. JSDoc 주석으로 예시 포함
3. `index.ts`에서 export
4. 이 문서에 키 패턴 추가

---

## 6. 무효화 전략

### 6.1 캐시 무효화

| 이벤트 | 무효화 대상 |
|--------|------------|
| 상품 정보 수정 | `cache:product:detail:{productId}`, `cache:product:options:{productId}` |
| 옵션 정보 수정 | `cache:product:option:{productId}:{optionId}`, `cache:product:options:{productId}` |
| 재고 변경 | `cache:product:option:{productId}:{optionId}` |

### 6.2 무효화 코드 예시

```typescript
import { ProductCacheKeys } from 'src/common/redis';

// 상품 업데이트 후 캐시 무효화
await cacheService.delete(ProductCacheKeys.detail(productId));
await cacheService.delete(ProductCacheKeys.options(productId));
```

---

## 7. 모니터링 및 디버깅

### 7.1 Redis CLI 명령어

```bash
# 모든 캐시 키 조회
redis-cli KEYS "cache:*"

# 특정 상품 캐시 조회
redis-cli KEYS "cache:product:*:123*"

# 모든 락 키 조회
redis-cli KEYS "lock:*"

# 랭킹 데이터 조회 (상위 10개)
redis-cli ZREVRANGE "ranking:product:sales:2025-01-15" 0 9 WITHSCORES

# TTL 확인
redis-cli TTL "cache:product:detail:123"

# 키 삭제
redis-cli DEL "cache:product:detail:123"
```

### 7.2 일괄 삭제

```bash
# 특정 패턴의 캐시 일괄 삭제
redis-cli KEYS "cache:product:*" | xargs redis-cli DEL

# 임시 키 정리
redis-cli KEYS "temp:*" | xargs redis-cli DEL
```
