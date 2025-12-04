# Week 7 - 쿠폰 발급 로직 Redis 기반 개선 보고서

**작성일**: 2025-12-05
**프로젝트**: HHPlus E-Commerce Backend
**분석 범위**: 선착순 쿠폰 발급 시스템 Redis 마이그레이션

---

## 1. 배경

### 1.1 문제 상황

- RDB에만 의존할 경우, 쿠폰 이벤트와 같은 대용량 트래픽이 몰릴 때 처리 속도가 효율적이지 않음
- 기존 분산 락 방식은 동시성 문제를 해결했으나, 여전히 모든 발급 검증 로직이 DB에 의존
- 따라서 처리 로직 자체는 유지하면서 발급 검증 로직을 Redis로 대체하여 처리속도를 높이는 것을 목표로 함

### 1.2 개선 목표

1. **발급 가능 여부 판단**: DB 조회 → Redis 조회로 전환
2. **재고 차감**: DB UPDATE → Redis DECR 원자적 연산
3. **중복 발급 확인**: DB 쿼리 → Redis SET 자료구조 (O(1))
4. **영속성 보장**: DB는 최종 이력 저장만 담당

---

## 2. 고려사항

### 2.1 Redis 도입 장단점 분석

| 구분 | 장점 | 단점 |
|------|------|------|
| **성능** | 메모리 기반 연산으로 빠른 처리속도 | - |
| **확장성** | 클러스터 확장 가능 | - |
| **운영** | - | 저장소 이중화로 복잡도 증가 |
| **장애 영향** | - | Redis 장애 시 서비스 영향 |
| **정합성** | - | Redis-DB 간 데이터 동기화 필요 |

### 2.2 역할 분담 결정

| 저장소 | 담당 역할 |
|--------|----------|
| **Redis** | 발급 가능 여부 판단, 재고 차감, 중복 발급 확인 |
| **RDB** | 쿠폰 발급 이력 영구 저장 (user_coupons, issued_count) |

**결정 근거**:
- 빠른 판단이 필요한 검증 로직 → Redis
- 영속성이 필요한 데이터 저장 → RDB
- 최소한의 변경으로 성능 최적화

---

## 3. 구현 내용

### 3.1 Redis Key/TTL 설정 추가

```typescript
// src/common/redis/keys/coupon.keys.ts
export const CouponStockKeys = {
  // 쿠폰 남은 재고 (String)
  stock: (couponId: number) => `coupon:stock:${couponId}`,

  // 발급받은 사용자 목록 (Set)
  issuedUsers: (couponId: number) => `coupon:issued_users:${couponId}`,

  // 쿠폰 메타데이터 (Hash)
  meta: (couponId: number) => `coupon:meta:${couponId}`,
};
```

```typescript
// src/common/redis/ttl/ttl.config.ts
export const RedisTTL = {
  COUPON: {
    META: 60 * 60,                // 메타데이터: 1시간
    STOCK_DATA: 7 * 24 * 60 * 60, // 재고/사용자: 7일
  },
};
```

### 3.2 Redis 쿠폰 재고 Repository

```typescript
// src/modules/coupon/infrastructure/repositories/redis-coupon-stock.repository.ts
@Injectable()
export class RedisCouponStockRepository implements ICouponStockRepository {

  async tryIssue(userId: number, couponId: number): Promise<CouponIssuanceResult> {
    const stockKey = CouponStockKeys.stock(couponId);
    const usersKey = CouponStockKeys.issuedUsers(couponId);

    // 1. 중복 발급 확인 - O(1)
    const alreadyIssued = await this.redis.sismember(usersKey, String(userId));
    if (alreadyIssued === 1) {
      return { status: 'ALREADY_ISSUED' };
    }

    // 2. 재고 확인
    const currentStock = await this.redis.get(stockKey);
    if (currentStock === null || parseInt(currentStock, 10) <= 0) {
      return { status: 'OUT_OF_STOCK', remainingStock: 0 };
    }

    // 3. 재고 차감 (원자적)
    const newStock = await this.redis.decr(stockKey);

    // 4. 차감 후 음수 확인 (경쟁 조건 방어)
    if (newStock < 0) {
      await this.redis.incr(stockKey);
      return { status: 'OUT_OF_STOCK', remainingStock: 0 };
    }

    // 5. 발급 사용자 등록
    await this.redis.sadd(usersKey, String(userId));

    return { status: 'SUCCESS', remainingStock: newStock };
  }

  async rollbackIssuance(userId: number, couponId: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.incr(CouponStockKeys.stock(couponId));
    pipeline.srem(CouponStockKeys.issuedUsers(couponId), String(userId));
    await pipeline.exec();
  }
}
```

#### 3.3 발급 UseCase 개선

```typescript
// src/modules/coupon/application/use-cases/issue-coupon.use-case.ts
@Injectable()
export class IssueCouponUseCase {
  async execute(userId: number, couponId: number): Promise<UserCouponWithDetailDto> {
    // 1. 비즈니스 유효성 검증 (Domain Service - 쿠폰 존재, 활성화, 유효기간)
    const coupon = await this.couponDomainService.validateCouponForIssuance(couponId);

    // 2. Redis 데이터 동기화 확인 (캐시 미스 시 DB → Redis 동기화)
    await this.couponStockSyncService.ensureSynced(couponId);

    // 3. 분산 락 + Redis 발급 + DB 저장
    return await this.issueWithDistributedLock(userId, couponId, coupon);
  }

  private async issueWithDistributedLock(...): Promise<UserCoupon> {
    return await this.distributedLockService.executeWithLock(lockKey, async () => {
      // Redis 발급 시도 (중복 확인 + 재고 차감)
      const result = await this.couponStockRepository.tryIssue(userId, couponId);

      if (result.status !== 'SUCCESS') {
        throw this.mapStatusToException(result.status, couponId);
      }

      // DB 영구 저장
      try {
        return await this.saveToDatabase(userId, couponId);
      } catch (dbError) {
        // 롤백: Redis 상태 복구
        await this.couponStockRepository.rollbackIssuance(userId, couponId);
        throw dbError;
      }
    });
  }
}
```

#### 3.4 데이터 동기화 서비스

```typescript
// src/modules/coupon/infrastructure/services/coupon-stock-sync.service.ts
@Injectable()
export class CouponStockSyncService implements OnModuleInit {

  async onModuleInit(): Promise<void> {
    // 애플리케이션 시작 시 활성 쿠폰 동기화
    await this.syncAllActiveCoupons();
  }

  async syncCoupon(coupon: Coupon): Promise<void> {
    const ttl = this.calculateTTL(coupon.validUntil);

    // 1. 재고 동기화 (issue_limit - issued_count)
    await this.couponStockRepository.syncStock(coupon.id, coupon.getRemainingCount(), ttl);

    // 2. 발급 사용자 목록 동기화
    const issuedUserIds = await this.userCouponRepository.getUserIdsByCoupon(coupon.id);
    await this.couponStockRepository.syncIssuedUsers(coupon.id, issuedUserIds, ttl);

    // 3. 메타데이터 캐싱
    await this.couponStockRepository.cacheMetadata(coupon.id, { ... });
  }
}
```

## 4. 아키텍처

### 4.1 발급 처리 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                     IssueCouponUseCase                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. 쿠폰 유효성 검증 (CouponDomainService)                  │  │
│  │    - 쿠폰 존재 여부, 활성화 상태, 유효기간                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                 │
│                                ▼                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 2. Redis 데이터 동기화 확인 (CouponStockSyncService)       │  │
│  │    - 캐시 미스 시 DB → Redis 동기화                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                 │
│                                ▼                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 3. 분산 락 획득 (DistributedLockService - Redlock)         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                 │
│                                ▼                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 4. Redis 발급 시도 (RedisCouponStockRepository)            │  │
│  │    - SISMEMBER: 중복 발급 확인 O(1)                        │  │
│  │    - GET/DECR: 재고 확인 및 차감 (원자적)                  │  │
│  │    - SADD: 발급 사용자 등록                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                 │
│            ┌───────────────────┴───────────────────┐            │
│            ▼ (SUCCESS)                    ▼ (FAIL)              │
│  ┌──────────────────┐               ┌──────────────────┐        │
│  │ 5. DB 영구 저장   │               │ Exception 반환   │        │
│  │    - issued_count │               │ - ALREADY_ISSUED │        │
│  │    - user_coupons │               │ - OUT_OF_STOCK   │        │
│  └────────┬─────────┘               └──────────────────┘        │
│           │                                                      │
│    ┌──────┴──────┐                                              │
│    ▼ (성공)      ▼ (실패)                                       │
│  [응답 반환]  [Redis 롤백]                                       │
│              - INCR (재고 복구)                                  │
│              - SREM (사용자 제거)                                │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Redis 키 설계

| 키 패턴 | 자료구조 | 용도 | TTL |
|---------|----------|------|-----|
| `coupon:stock:{id}` | String | 남은 재고 수량 | 7일 |
| `coupon:issued_users:{id}` | Set | 발급받은 사용자 ID | 7일 |
| `coupon:meta:{id}` | Hash | 메타데이터 캐시 | 1시간 |

---

## 5. 테스트 검증

### 5.1 동시성 테스트

```typescript
// test/coupon-issuance-concurrency.e2e-spec.ts
describe('발급 한도 초과 방지 (Redis 기반)', () => {
  it('동시에 100명이 요청해도 발급 한도(100개)를 초과하지 않아야 함', async () => {
    const coupon = await fixture.createCoupon({ issueLimit: 100 });
    const users = await createUsers(100);

    const results = await Promise.allSettled(
      users.map(user => issueCouponUseCase.execute(user.id, coupon.id))
    );

    expect(results.filter(r => r.status === 'fulfilled').length).toBe(100);

    // Redis 재고 검증
    expect(await redisCouponStockRepository.getRemainingStock(coupon.id)).toBe(0);
  });

  it('동시에 150명이 요청하면 100개만 성공하고 50개는 실패해야 함', async () => {
    // ... 100개 성공, 50개 실패 검증
  });
});

describe('중복 발급 방지 (Redis SET 기반)', () => {
  it('동일 사용자가 동시에 여러 번 요청해도 1번만 발급되어야 함', async () => {
    // ... 1개 성공, 9개 실패 검증
  });
});
```

### 5.2 롤백 테스트

```typescript
// test/coupon-issuance-rollback.e2e-spec.ts
describe('DB 저장 실패 시 Redis 롤백', () => {
  it('DB 트랜잭션 실패 시 Redis 재고와 발급 사용자가 복구되어야 함', async () => {
    // 초기 Redis 상태 확인
    expect(await redisCouponStockRepository.getRemainingStock(coupon.id)).toBe(10);

    // DB 실패 시뮬레이션
    await expect(failingUseCase.execute(user.id, coupon.id)).rejects.toThrow();

    // Redis 상태 복구 확인
    expect(await redisCouponStockRepository.getRemainingStock(coupon.id)).toBe(10);
    expect(await redisCouponStockRepository.hasUserIssued(user.id, coupon.id)).toBe(false);
  });

  it('롤백 후 재시도하면 정상 발급되어야 함', async () => {
    // 1차 실패 → 롤백 확인 → 2차 성공 검증
  });
});
```

### 5.3 테스트 결과

```
Coupon Issuance Concurrency with Redis (e2e)
  발급 한도 초과 방지 (Redis 기반)
    √ 동시에 100명이 요청해도 발급 한도(100개)를 초과하지 않아야 함
    √ 동시에 150명이 요청하면 100개만 성공하고 50개는 실패해야 함
    √ 발급 한도가 거의 찬 상황에서 동시 요청 시 정확히 남은 개수만큼만 발급
  중복 발급 방지 (Redis SET 기반)
    √ 동일 사용자가 동시에 여러 번 요청해도 1번만 발급되어야 함
    √ 여러 사용자가 동시 요청 시 각 사용자당 1개씩만 발급되어야 함
  Redis-DB 데이터 정합성 검증
    √ 동시 발급 후 Redis 재고와 DB issued_count가 일치해야 함
    √ Redis 발급 사용자 SET과 DB user_coupons가 일치해야 함

Coupon Issuance Rollback Scenarios (e2e)
  DB 저장 실패 시 Redis 롤백
    √ DB 트랜잭션 실패 시 Redis 재고와 발급 사용자가 복구되어야 함
    √ 부분 성공/실패 시 성공한 발급만 유지되어야 함
  Redis-DB 정합성 복구
    √ 롤백 후 재시도하면 정상 발급되어야 함
```

---

## 6. 예상 효과

### 6.1 성능 개선

| 항목 | 기존 (DB 조회) | 개선 (Redis) | 개선율 |
|------|---------------|--------------|--------|
| 중복 확인 | ~30ms (DB 쿼리) | ~1ms (SISMEMBER) | 97% |
| 재고 확인/차감 | ~50ms (조회+UPDATE) | ~2ms (GET/DECR) | 96% |
| 전체 발급 처리 | ~100ms | ~20ms | 80% |

### 6.2 아키텍처 개선

| 항목 | 효과 |
|------|------|
| DB 부하 분산 | 발급 검증 로직이 Redis로 이동하여 DB 부하 감소 |
| 확장성 | Redis 클러스터 확장으로 처리량 증가 가능 |
| 장애 격리 | Redis 실패 시 롤백 처리로 데이터 정합성 보장 |

---

## 7. 결론

### 7.1 핵심 성과

1. **Redis 기반 발급 검증 로직 구현**
   - 재고 관리: Redis String + `DECR` 원자적 연산
   - 중복 확인: Redis Set + `SISMEMBER` O(1) 조회

2. **데이터 정합성 보장**
   - Redis 발급 성공 → DB 저장 실패 시 자동 롤백
   - 애플리케이션 시작 시 DB → Redis 자동 동기화

3. **관심사 분리**
   - `CouponDomainService`: 순수 비즈니스 로직 (검증, 조회)
   - `RedisCouponStockRepository`: 발급 검증 인프라
   - `IssueCouponUseCase`: 오케스트레이션
