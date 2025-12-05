# Week 7 - 인기 상품 조회 Redis 기반 개선 보고서

**작성일**: 2025-12-05
**프로젝트**: HHPlus E-Commerce Backend
**분석 범위**: 상품 랭킹 시스템 Redis 마이그레이션

---

## 1. 배경

### 1.1 문제 상황

- 기존 인기 상품 조회는 order_items 테이블에서 최근 3일간 판매 데이터를 집계
- 매 조회 시 GROUP BY + ORDER BY 연산으로 DB 부하 발생
- 트래픽 증가 시 응답 시간 지연 예상

### 1.2 개선 목표

1. **실시간 랭킹 업데이트**: 주문 완료 시 Redis SortedSet에 판매량 반영
2. **빠른 조회**: O(log N) 복잡도의 ZREVRANGE로 상위 상품 조회
3. **기간별 합산**: 일별 키 분리 + ZUNIONSTORE로 유연한 기간 집계

---

## 2. 고려사항

### 2.1 Redis SortedSet 선택 이유

| 자료구조 | 장점 | 단점 |
|----------|------|------|
| **List** | 순서 보장 | 정렬 연산 비용 O(N) |
| **Hash** | 필드별 접근 | 정렬 불가 |
| **SortedSet** | O(log N) 정렬, 점수 기반 랭킹 | 메모리 사용량 증가 |

**결정**: SortedSet의 ZINCRBY, ZREVRANGE 명령어가 랭킹 시스템에 최적화

### 2.2 키 설계 전략

| 구분 | 설계 | 이유 |
|------|------|------|
| **일별 분리** | ranking:product:sales:2025-12-05 | 기간별 유연한 집계 가능 |
| **TTL 적용** | 7일 | 메모리 효율화, 오래된 데이터 자동 삭제 |
| **캐시 분리** | cache:ranking:popular:3 | 조회 결과 캐싱으로 연산 최소화 |

---

## 3. 구현 내용

### 3.1 Redis Key 설계

```typescript
// src/common/redis/keys/ranking.keys.ts
export const ProductRankingKeys = {
  // 일별 판매 랭킹 키 (Sorted Set)
  // @example ranking:product:sales:2025-12-05
  dailySales: (date: Date): string =>
    RedisKeyBuilder.build(PREFIX, 'product', 'sales', RedisKeyBuilder.formatDate(date)),

  // 일별 판매 랭킹 키 목록 생성 (최근 N일)
  dailySalesRange: (days: number): string[] => {
    const keys: string[] = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      keys.push(ProductRankingKeys.dailySales(date));
    }
    return keys;
  },
};
```

```typescript
// src/common/redis/keys/cache.keys.ts
export const RankingCacheKeys = {
  // 인기 상품 캐시 키
  // @example cache:ranking:popular:3
  popularProducts: (days: number): string =>
    RedisKeyBuilder.build(PREFIX, 'ranking', 'popular', days),
};
```

### 3.2 상품 랭킹 Repository 인터페이스

```typescript
// src/modules/product/domain/repositories/product-ranking.repository.interface.ts
export interface IProductRankingRepository {
  // 상품 판매 점수 증가 (주문 완료 시 호출)
  incrementScore(productId: number, quantity: number, date?: Date): Promise<number>;

  // 여러 상품의 판매 점수 일괄 증가 (파이프라인 사용)
  incrementScoreBatch(
    items: Array<{ productId: number; quantity: number }>,
    date?: Date,
  ): Promise<void>;

  // 기간별 상위 상품 조회
  getTopProducts(
    days?: number,
    limit?: number,
  ): Promise<Array<{ productId: number; totalSales: number }>>;

  // 특정 일자의 상품 랭킹 조회
  getDailyRanking(date: Date, limit: number): Promise<Array<{ productId: number; sales: number }>>;

  // 특정 상품의 기간별 순위 조회
  getProductRank(productId: number, days?: number): Promise<number | null>;
}
```

### 3.3 Redis 상품 랭킹 Repository 구현

```typescript
// src/modules/product/infrastructure/repositories/redis-product-ranking.repository.ts
@Injectable()
export class RedisProductRankingRepository implements IProductRankingRepository {

  async incrementScore(productId: number, quantity: number, date: Date = new Date()): Promise<number> {
    const key = this.getDailyKey(date);

    // 파이프라인으로 ZINCRBY + EXPIRE 실행
    const pipeline = this.redis.pipeline();
    pipeline.zincrby(key, quantity, String(productId));
    pipeline.expire(key, RedisTTL.RANKING.DAILY_SALES);

    const results = await pipeline.exec();
    return parseFloat(results?.[0]?.[1] as string) || 0;
  }

  async incrementScoreBatch(
    items: Array<{ productId: number; quantity: number }>,
    date: Date = new Date(),
  ): Promise<void> {
    if (items.length === 0) return;

    const key = this.getDailyKey(date);
    const pipeline = this.redis.pipeline();

    for (const item of items) {
      pipeline.zincrby(key, item.quantity, String(item.productId));
    }
    pipeline.expire(key, RedisTTL.RANKING.DAILY_SALES);

    await pipeline.exec();
  }

  async getTopProducts(days: number = 3, limit: number = 5): Promise<Array<...>> {
    // 1. 캐시 확인
    const cacheKey = this.getCacheKey(days);
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. 일별 키 목록에서 존재하는 키만 필터링
    const keys = this.generateDailyKeys(days);
    const existingKeys = await this.filterExistingKeys(keys);
    if (existingKeys.length === 0) return [];

    // 3. 임시 키에 합산 (ZUNIONSTORE)
    const tempKey = RankingTempKeys.salesUnion();
    await this.redis.zunionstore(tempKey, existingKeys.length, ...existingKeys);

    // 4. 상위 N개 조회 (ZREVRANGE with WITHSCORES)
    const results = await this.redis.zrevrange(tempKey, 0, limit - 1, 'WITHSCORES');

    // 5. 임시 키 삭제 및 결과 파싱
    await this.redis.del(tempKey);
    const rankings = this.parseResults(results);

    // 6. 캐시 저장
    if (rankings.length > 0) {
      await this.redis.setex(cacheKey, cacheTtlSeconds, JSON.stringify(rankings));
    }

    return rankings;
  }
}
```

### 3.4 상품 랭킹 Application Service

```typescript
// src/modules/product/application/services/product-ranking.service.ts
@Injectable()
export class ProductRankingService {
  constructor(
    @Inject('IProductRankingRepository')
    private readonly productRankingRepository: IProductRankingRepository,
  ) {}

  // 주문 완료 시 상품 랭킹 업데이트
  async updateRankingByOrderItems(
    items: Array<{ productId: number; quantity: number }>,
  ): Promise<void> {
    if (items.length === 0) return;
    await this.productRankingRepository.incrementScoreBatch(items);
  }

  // 인기 상품 조회
  async getTopProducts(days?: number, limit?: number): Promise<Array<...>> {
    return await this.productRankingRepository.getTopProducts(days, limit);
  }
}
```

### 3.5 결제 완료 후 처리 서비스

```typescript
// src/modules/order/application/services/post-payment.service.ts
@Injectable()
export class PostPaymentService {
  constructor(
    private readonly externalDataTransmissionService: ExternalDataTransmissionService,
    private readonly productRankingService: ProductRankingService,
  ) {}

  // 결제 완료 후 비동기 작업 실행
  // - 외부 데이터 전송
  // - 상품 랭킹 업데이트
  // 모든 작업은 실패해도 결제에 영향을 주지 않음
  async executePostPaymentTasks(
    orderId: number,
    orderItems: Array<{ productId: number; quantity: number }>,
  ): Promise<PostPaymentResult> {
    // 1. 외부 데이터 전송 (비동기, 실패 무시)
    try {
      await this.externalDataTransmissionService.transmitOrderData(orderId);
    } catch (error) { /* 로깅 */ }

    // 2. 상품 랭킹 업데이트 (비동기, 실패 무시)
    try {
      await this.productRankingService.updateRankingByOrderItems(orderItems);
    } catch (error) { /* 로깅 */ }

    return { dataTransmissionStatus };
  }
}
```

### 3.6 인기 상품 조회 서비스 개선

```typescript
// src/modules/product/domain/services/product-query.service.ts
@Injectable()
export class ProductQueryService {
  constructor(
    @Inject('IProductRankingRepository')
    private readonly productRankingRepository: IProductRankingRepository,
  ) {}

  // FR-P-008: 인기 상품 조회 (Top 5)
  // 최근 3일간 판매량 기준 상위 5개 상품 조회
  // Redis SortedSet 기반으로 구현
  // - 일별 판매 데이터 합산 (ZUNIONSTORE)
  // - 상위 5개 상품 조회 (ZREVRANGE)
  async getPopularProducts(): Promise<{
    period: string;
    products: Array<{
      rank: number;
      productId: number;
      productName: string;
      thumbnailUrl: string | null;
      salesCount: number;
      salesAmount: number;
    }>;
  }> {
    // 1. Redis에서 인기 상품 랭킹 조회
    const rankings = await this.productRankingRepository.getTopProducts(3, 5);

    // 2. 상품 상세 정보 조회 및 DTO 변환
    const productDetails = await Promise.all(
      rankings.map(async (ranking, index) => {
        const product = await this.productRepository.findById(ranking.productId);
        if (!product || product.isDeleted()) return null;

        return {
          rank: index + 1,
          productId: product.id,
          productName: product.productName,
          thumbnailUrl: product.thumbnailUrl,
          salesCount: ranking.totalSales,
          salesAmount: calculateSalesAmount(ranking, options),
        };
      }),
    );

    return { period, products: validProducts };
  }
}
```

---

## 4. 아키텍처

### 4.1 랭킹 업데이트 흐름

```
[주문 결제 완료] (ProcessOrderPaymentUseCase)
         |
         v
[PostPaymentService]
  - executePostPaymentTasks()
    - 외부 데이터 전송 (비동기)
    - 상품 랭킹 업데이트 (비동기)
         |
         v
[ProductRankingService]
  - updateRankingByOrderItems()
    - 주문 항목별 상품 ID, 수량 전달
         |
         v
[RedisProductRankingRepository]
  - incrementScoreBatch()
    - Pipeline으로 ZINCRBY 일괄 실행
    - 일별 키에 TTL 설정 (7일)
         |
         v
[Redis]
  ranking:product:sales:2025-12-05 (SortedSet)
    - member: productId
    - score: 판매 수량
```

### 4.2 인기 상품 조회 흐름

```
[GET /products/popular]
         |
         v
[ProductQueryService.getPopularProducts()]
         |
         v
[RedisProductRankingRepository.getTopProducts()]
  |
  +-- 1. 캐시 확인 (cache:ranking:popular:3)
  |      - 캐시 히트 시 즉시 반환 (5분 TTL)
  |
  +-- 2. 캐시 미스 시 일별 키 합산
  |      - ranking:product:sales:2025-12-05
  |      - ranking:product:sales:2025-12-04
  |      - ranking:product:sales:2025-12-03
  |      -> ZUNIONSTORE temp:ranking:sales:...
  |
  +-- 3. 상위 5개 조회
  |      - ZREVRANGE temp:ranking:sales:... 0 4 WITHSCORES
  |      - 임시 키 삭제
  |
  +-- 4. 캐시 저장
         - cache:ranking:popular:3에 결과 저장 (5분 TTL)
```

### 4.3 Redis 키 설계

| 키 패턴 | 자료구조 | 용도 | TTL |
|---------|----------|------|-----|
| ranking:product:sales:{date} | SortedSet | 일별 판매 데이터 | 7일 |
| cache:ranking:popular:{days} | String(JSON) | 인기 상품 조회 캐시 | 5분 |
| temp:ranking:sales:{timestamp}:{uuid} | SortedSet | 합산 연산용 임시 키 | 즉시 삭제 |
| temp:ranking:rank:{timestamp}:{uuid} | SortedSet | 순위 조회용 임시 키 | 즉시 삭제 |

---

## 5. 테스트 검증

### 5.1 기간별 합산 테스트

```typescript
describe('기간별 합산 조회', () => {
  it('여러 일자의 판매 데이터가 합산되어야 함', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await rankingRepository.incrementScore(1, 10, today);
    await rankingRepository.incrementScore(1, 20, yesterday);

    const ranking = await rankingRepository.getTopProducts(3, 5);
    const product1 = ranking.find((r) => r.productId === 1);
    expect(product1?.totalSales).toBe(30); // 10 + 20
  });

  it('조회 기간 외의 데이터는 합산에 포함되지 않아야 함', async () => {
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    await rankingRepository.incrementScore(1, 100, new Date());
    await rankingRepository.incrementScore(1, 1000, fourDaysAgo);

    const ranking = await rankingRepository.getTopProducts(3, 5);
    expect(ranking[0]?.totalSales).toBe(100); // 오늘 데이터만
  });
});
```

### 5.2 동시성 테스트

```typescript
describe('동시성 테스트', () => {
  it('동시에 100개 요청을 보내도 정확한 합계가 유지되어야 함', async () => {
    const productId = 999;
    const requests = 100;

    await Promise.all(
      Array.from({ length: requests }, () =>
        rankingRepository.incrementScore(productId, 1),
      ),
    );

    const ranking = await rankingRepository.getDailyRanking(new Date(), 1000);
    expect(ranking.find((r) => r.productId === productId)?.sales).toBe(100);
  });

  it('여러 상품에 대한 동시 배치 요청이 정확하게 처리되어야 함', async () => {
    const batches = Array.from({ length: 10 }, () =>
      Array.from({ length: 5 }, (_, i) => ({ productId: i + 1, quantity: 10 })),
    );

    await Promise.all(
      batches.map((batch) => rankingRepository.incrementScoreBatch(batch)),
    );

    const ranking = await rankingRepository.getTopProducts(1, 10);
    for (const item of ranking) {
      expect(item.totalSales).toBe(100); // 10개 배치 * 10점
    }
  });
});
```

### 5.3 테스트 결과

```
Product Ranking System (e2e)
  점수 증가 (incrementScore)
    v 단일 상품 점수가 정상적으로 증가해야 함
    v 동일 상품의 점수가 누적되어야 함
    v 다른 상품의 점수는 독립적으로 관리되어야 함
  배치 점수 증가 (incrementScoreBatch)
    v 여러 상품의 점수가 한 번에 증가해야 함
    v 빈 배열 입력 시 오류 없이 처리되어야 함
    v 배치 증가 후 기존 점수에 누적되어야 함
  상위 상품 조회 (getTopProducts)
    v 상위 N개 상품을 점수 순으로 반환해야 함
    v 데이터가 없을 때 빈 배열을 반환해야 함
    v 요청한 limit보다 데이터가 적을 때 있는 만큼만 반환해야 함
  기간별 합산 조회
    v 여러 일자의 판매 데이터가 합산되어야 함
    v 조회 기간 외의 데이터는 합산에 포함되지 않아야 함
  일별 랭킹 조회 (getDailyRanking)
    v 특정 일자의 랭킹만 반환해야 함
  상품 순위 조회 (getProductRank)
    v 특정 상품의 순위를 반환해야 함
    v 존재하지 않는 상품은 null을 반환해야 함
    v 데이터가 없을 때 null을 반환해야 함
  동시성 테스트
    v 동시에 100개 요청을 보내도 정확한 합계가 유지되어야 함
    v 여러 상품에 대한 동시 배치 요청이 정확하게 처리되어야 함
    v 동시 증가와 조회가 충돌 없이 처리되어야 함
  캐시 동작 검증
    v 동일한 조회를 반복해도 결과가 일관되어야 함
```

---

## 6. 예상 효과

### 6.1 성능 개선

| 항목 | 기존 (DB 집계) | 개선 (Redis) | 개선율 |
|------|---------------|--------------|--------|
| 인기 상품 조회 | ~200ms (GROUP BY + ORDER BY) | ~5ms (ZREVRANGE) | 97% |
| 캐시 히트 시 | - | ~1ms | 99% |
| 랭킹 업데이트 | ~30ms (UPDATE) | ~2ms (ZINCRBY) | 93% |

### 6.2 아키텍처 개선

| 항목 | 효과 |
|------|------|
| DB 부하 분산 | 집계 쿼리가 Redis로 이동하여 DB 읽기 부하 감소 |
| 실시간성 | 주문 완료 즉시 랭킹 반영 (기존: 배치 집계) |
| 확장성 | Redis 클러스터 확장으로 처리량 증가 가능 |
| 유연성 | 일별 키 분리로 다양한 기간 집계 지원 |

---

## 7. 결론

### 7.1 핵심 성과

1. **Redis SortedSet 기반 랭킹 시스템 구현**
   - ZINCRBY: 원자적 점수 증가
   - ZUNIONSTORE: 기간별 데이터 합산
   - ZREVRANGE: O(log N) 상위 상품 조회

2. **계층 분리 및 DIP 적용**
   - IProductRankingRepository: 도메인 레이어 인터페이스
   - RedisProductRankingRepository: 인프라 구현체
   - ProductRankingService: Application Service

3. **결제 후처리 분리**
   - PostPaymentService: 비동기 후처리 담당
   - 외부 전송 및 랭킹 업데이트 실패가 결제에 영향 없음

4. **캐싱 전략**
   - 조회 결과 캐싱 (5분 TTL)
   - 일별 데이터 자동 만료 (7일 TTL)
