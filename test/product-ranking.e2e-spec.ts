import { PrismaClient } from '@prisma/client';
import { TestDatabaseHelper } from './helpers/test-database.helper';
import { RedisProductRankingRepository } from '../src/modules/product/infrastructure/repositories/redis-product-ranking.repository';

/**
 * 상품 랭킹 시스템 통합 테스트
 *
 * 목적:
 * - Redis SortedSet 기반 상품 랭킹 기능 검증
 * - 일별 판매 데이터 저장 및 기간별 합산 조회 검증
 * - 동시성 상황에서 데이터 정합성 검증
 *
 * 테스트 환경:
 * - TestContainer 기반 실제 Redis 7 환경
 * - Mock 없이 실제 Redis SortedSet 연산 사용
 */
describe('Product Ranking System (e2e)', () => {
  let prisma: PrismaClient;
  let rankingRepository: RedisProductRankingRepository;

  beforeAll(async () => {
    // TestContainer 기반 MySQL + Redis 시작
    prisma = await TestDatabaseHelper.setup();

    // Redis 연결 정보 가져오기
    const redisConfig = TestDatabaseHelper.getRedisConfig();

    // ConfigService 모킹
    const configService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return redisConfig.host;
        if (key === 'REDIS_PORT') return redisConfig.port;
        return defaultValue;
      },
    } as any;

    // RedisProductRankingRepository 직접 인스턴스화
    rankingRepository = new RedisProductRankingRepository(configService);
  }, 60000);

  afterAll(async () => {
    // Repository 정리
    if (rankingRepository) {
      await rankingRepository.onModuleDestroy();
    }

    // TestContainer 정리
    await TestDatabaseHelper.teardown();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터 초기화
    await TestDatabaseHelper.cleanup();
  });

  describe('점수 증가 (incrementScore)', () => {
    it('단일 상품 점수가 정상적으로 증가해야 함', async () => {
      // Given
      const productId = 1;
      const quantity = 5;

      // When
      const score = await rankingRepository.incrementScore(productId, quantity);

      // Then
      expect(score).toBe(5);
    });

    it('동일 상품의 점수가 누적되어야 함', async () => {
      // Given
      const productId = 1;

      // When
      await rankingRepository.incrementScore(productId, 5);
      await rankingRepository.incrementScore(productId, 3);
      const finalScore = await rankingRepository.incrementScore(productId, 2);

      // Then
      expect(finalScore).toBe(10);
    });

    it('다른 상품의 점수는 독립적으로 관리되어야 함', async () => {
      // Given
      const productId1 = 1;
      const productId2 = 2;

      // When
      await rankingRepository.incrementScore(productId1, 10);
      await rankingRepository.incrementScore(productId2, 20);
      const score1 = await rankingRepository.incrementScore(productId1, 5);
      const score2 = await rankingRepository.incrementScore(productId2, 5);

      // Then
      expect(score1).toBe(15);
      expect(score2).toBe(25);
    });
  });

  describe('배치 점수 증가 (incrementScoreBatch)', () => {
    it('여러 상품의 점수가 한 번에 증가해야 함', async () => {
      // Given
      const items = [
        { productId: 1, quantity: 10 },
        { productId: 2, quantity: 20 },
        { productId: 3, quantity: 30 },
      ];

      // When
      await rankingRepository.incrementScoreBatch(items);

      // Then
      const ranking = await rankingRepository.getTopProducts(1, 10);
      expect(ranking).toHaveLength(3);
      expect(ranking[0]).toEqual({ productId: 3, totalSales: 30 });
      expect(ranking[1]).toEqual({ productId: 2, totalSales: 20 });
      expect(ranking[2]).toEqual({ productId: 1, totalSales: 10 });
    });

    it('빈 배열 입력 시 오류 없이 처리되어야 함', async () => {
      // Given
      const items: Array<{ productId: number; quantity: number }> = [];

      // When & Then: 오류 발생하지 않아야 함
      await expect(
        rankingRepository.incrementScoreBatch(items),
      ).resolves.not.toThrow();
    });

    it('배치 증가 후 기존 점수에 누적되어야 함', async () => {
      // Given
      await rankingRepository.incrementScore(1, 50);
      await rankingRepository.incrementScore(2, 30);

      const items = [
        { productId: 1, quantity: 10 },
        { productId: 2, quantity: 20 },
        { productId: 3, quantity: 100 },
      ];

      // When
      await rankingRepository.incrementScoreBatch(items);

      // Then
      const ranking = await rankingRepository.getTopProducts(1, 10);
      expect(ranking).toHaveLength(3);
      expect(ranking[0]).toEqual({ productId: 3, totalSales: 100 });
      expect(ranking[1]).toEqual({ productId: 1, totalSales: 60 }); // 50 + 10
      expect(ranking[2]).toEqual({ productId: 2, totalSales: 50 }); // 30 + 20
    });
  });

  describe('상위 상품 조회 (getTopProducts)', () => {
    it('상위 N개 상품을 점수 순으로 반환해야 함', async () => {
      // Given: 10개 상품에 판매 기록
      for (let i = 1; i <= 10; i++) {
        await rankingRepository.incrementScore(i, i * 10);
      }

      // When
      const top5 = await rankingRepository.getTopProducts(1, 5);

      // Then
      expect(top5).toHaveLength(5);
      expect(top5[0]).toEqual({ productId: 10, totalSales: 100 });
      expect(top5[1]).toEqual({ productId: 9, totalSales: 90 });
      expect(top5[2]).toEqual({ productId: 8, totalSales: 80 });
      expect(top5[3]).toEqual({ productId: 7, totalSales: 70 });
      expect(top5[4]).toEqual({ productId: 6, totalSales: 60 });
    });

    it('데이터가 없을 때 빈 배열을 반환해야 함', async () => {
      // When
      const result = await rankingRepository.getTopProducts(3, 5);

      // Then
      expect(result).toEqual([]);
    });

    it('요청한 limit보다 데이터가 적을 때 있는 만큼만 반환해야 함', async () => {
      // Given: 3개 상품만 존재
      await rankingRepository.incrementScore(1, 10);
      await rankingRepository.incrementScore(2, 20);
      await rankingRepository.incrementScore(3, 30);

      // When
      const result = await rankingRepository.getTopProducts(1, 10);

      // Then
      expect(result).toHaveLength(3);
    });
  });

  describe('기간별 합산 조회', () => {
    it('여러 일자의 판매 데이터가 합산되어야 함', async () => {
      // Given: 3일간 다른 날짜에 판매
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      await rankingRepository.incrementScore(1, 10, today);
      await rankingRepository.incrementScore(1, 20, yesterday);
      await rankingRepository.incrementScore(1, 30, twoDaysAgo);

      await rankingRepository.incrementScore(2, 5, today);
      await rankingRepository.incrementScore(2, 15, yesterday);

      // When
      const ranking = await rankingRepository.getTopProducts(3, 5);

      // Then
      const product1 = ranking.find((r) => r.productId === 1);
      const product2 = ranking.find((r) => r.productId === 2);

      expect(product1?.totalSales).toBe(60); // 10 + 20 + 30
      expect(product2?.totalSales).toBe(20); // 5 + 15
    });

    it('조회 기간 외의 데이터는 합산에 포함되지 않아야 함', async () => {
      // Given: 오늘과 4일 전 데이터
      const today = new Date();
      const fourDaysAgo = new Date(today);
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      await rankingRepository.incrementScore(1, 100, today);
      await rankingRepository.incrementScore(1, 1000, fourDaysAgo);

      // When: 최근 3일만 조회
      const ranking = await rankingRepository.getTopProducts(3, 5);

      // Then: 오늘 데이터(100)만 포함
      const product1 = ranking.find((r) => r.productId === 1);
      expect(product1?.totalSales).toBe(100);
    });
  });

  describe('일별 랭킹 조회 (getDailyRanking)', () => {
    it('특정 일자의 랭킹만 반환해야 함', async () => {
      // Given
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await rankingRepository.incrementScore(1, 100, today);
      await rankingRepository.incrementScore(2, 200, today);
      await rankingRepository.incrementScore(1, 500, yesterday);
      await rankingRepository.incrementScore(3, 300, yesterday);

      // When
      const todayRanking = await rankingRepository.getDailyRanking(today, 10);
      const yesterdayRanking = await rankingRepository.getDailyRanking(
        yesterday,
        10,
      );

      // Then
      expect(todayRanking).toHaveLength(2);
      expect(todayRanking[0]).toEqual({ productId: 2, sales: 200 });
      expect(todayRanking[1]).toEqual({ productId: 1, sales: 100 });

      expect(yesterdayRanking).toHaveLength(2);
      expect(yesterdayRanking[0]).toEqual({ productId: 1, sales: 500 });
      expect(yesterdayRanking[1]).toEqual({ productId: 3, sales: 300 });
    });
  });

  describe('상품 순위 조회 (getProductRank)', () => {
    it('특정 상품의 순위를 반환해야 함', async () => {
      // Given
      await rankingRepository.incrementScore(1, 100);
      await rankingRepository.incrementScore(2, 200);
      await rankingRepository.incrementScore(3, 300);
      await rankingRepository.incrementScore(4, 50);

      // When
      const rank1 = await rankingRepository.getProductRank(1);
      const rank2 = await rankingRepository.getProductRank(2);
      const rank3 = await rankingRepository.getProductRank(3);
      const rank4 = await rankingRepository.getProductRank(4);

      // Then (1-based ranking)
      expect(rank3).toBe(1); // 300점으로 1위
      expect(rank2).toBe(2); // 200점으로 2위
      expect(rank1).toBe(3); // 100점으로 3위
      expect(rank4).toBe(4); // 50점으로 4위
    });

    it('존재하지 않는 상품은 null을 반환해야 함', async () => {
      // Given
      await rankingRepository.incrementScore(1, 100);

      // When
      const rank = await rankingRepository.getProductRank(999);

      // Then
      expect(rank).toBeNull();
    });

    it('데이터가 없을 때 null을 반환해야 함', async () => {
      // When
      const rank = await rankingRepository.getProductRank(1);

      // Then
      expect(rank).toBeNull();
    });
  });

  describe('동시성 테스트', () => {
    it('동시에 100개 요청을 보내도 정확한 합계가 유지되어야 함', async () => {
      // Given
      const productId = 999;
      const requests = 100;
      const quantityPerRequest = 1;

      // When: 100개 동시 요청
      await Promise.all(
        Array.from({ length: requests }, () =>
          rankingRepository.incrementScore(productId, quantityPerRequest),
        ),
      );

      // Then
      const ranking = await rankingRepository.getDailyRanking(new Date(), 1000);
      const product = ranking.find((r) => r.productId === productId);
      expect(product?.sales).toBe(requests * quantityPerRequest);
    }, 30000);

    it('여러 상품에 대한 동시 배치 요청이 정확하게 처리되어야 함', async () => {
      // Given: 10개의 배치 요청 (각각 5개 상품 포함)
      const batchCount = 10;
      const productsPerBatch = 5;

      const batches = Array.from({ length: batchCount }, (_, batchIndex) =>
        Array.from({ length: productsPerBatch }, (_, productIndex) => ({
          productId: productIndex + 1,
          quantity: 10,
        })),
      );

      // When: 10개 배치 동시 실행
      await Promise.all(
        batches.map((batch) => rankingRepository.incrementScoreBatch(batch)),
      );

      // Then: 각 상품은 100점 (10개 배치 * 10점)
      const ranking = await rankingRepository.getTopProducts(1, 10);
      expect(ranking).toHaveLength(5);

      for (const item of ranking) {
        expect(item.totalSales).toBe(100);
      }
    }, 30000);

    it('동시 증가와 조회가 충돌 없이 처리되어야 함', async () => {
      // Given: 초기 데이터 설정
      await rankingRepository.incrementScore(1, 100);
      await rankingRepository.incrementScore(2, 200);

      // When: 증가와 조회를 동시에 실행
      const operations = [
        ...Array.from({ length: 50 }, () =>
          rankingRepository.incrementScore(1, 1),
        ),
        ...Array.from({ length: 50 }, () =>
          rankingRepository.getTopProducts(1, 5),
        ),
      ];

      await Promise.all(operations);

      // Then: 최종 결과 확인
      const ranking = await rankingRepository.getTopProducts(1, 5);
      const product1 = ranking.find((r) => r.productId === 1);
      const product2 = ranking.find((r) => r.productId === 2);

      expect(product1?.totalSales).toBe(150); // 100 + 50
      expect(product2?.totalSales).toBe(200);
    }, 30000);
  });

  describe('캐시 동작 검증', () => {
    it('동일한 조회를 반복해도 결과가 일관되어야 함', async () => {
      // Given
      await rankingRepository.incrementScore(1, 100);
      await rankingRepository.incrementScore(2, 200);

      // When: 동일한 조회 3번 실행
      const result1 = await rankingRepository.getTopProducts(3, 5);
      const result2 = await rankingRepository.getTopProducts(3, 5);
      const result3 = await rankingRepository.getTopProducts(3, 5);

      // Then: 모든 결과가 동일
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });
});
