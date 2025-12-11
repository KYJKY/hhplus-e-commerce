import { TestDatabaseHelper } from './helpers/test-database.helper';
import { RedisCouponStockRepository } from '../src/modules/coupon/infrastructure/repositories/redis-coupon-stock.repository';

/**
 * RedisCouponStockRepository 통합 테스트
 *
 * 목적:
 * - Redis 자료구조 (STRING, SET, HASH) 동작 검증
 * - tryIssue 원자적 동작 검증
 * - rollbackIssuance 롤백 동작 검증
 * - 동기화 메서드 동작 검증
 *
 * 테스트 환경:
 * - TestContainer 기반 실제 Redis 7 환경
 */
describe('RedisCouponStockRepository (e2e)', () => {
  let redisCouponStockRepository: RedisCouponStockRepository;

  beforeAll(async () => {
    // TestContainer 기반 Redis 시작
    await TestDatabaseHelper.setup();

    const redisConfig = TestDatabaseHelper.getRedisConfig();

    const configService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return redisConfig.host;
        if (key === 'REDIS_PORT') return redisConfig.port;
        return defaultValue;
      },
    } as any;

    redisCouponStockRepository = new RedisCouponStockRepository(configService);
  }, 60000);

  afterAll(async () => {
    if (redisCouponStockRepository) {
      await redisCouponStockRepository.onModuleDestroy();
    }
    await TestDatabaseHelper.teardown();
  });

  beforeEach(async () => {
    await TestDatabaseHelper.cleanup();
  });

  describe('syncStock - 재고 동기화', () => {
    it('재고를 Redis STRING으로 저장해야 함', async () => {
      const couponId = 1;
      const remainingStock = 100;

      await redisCouponStockRepository.syncStock(couponId, remainingStock);

      const stock =
        await redisCouponStockRepository.getRemainingStock(couponId);
      expect(stock).toBe(100);
    });

    it('재고 0도 정상적으로 저장해야 함', async () => {
      const couponId = 2;

      await redisCouponStockRepository.syncStock(couponId, 0);

      const stock =
        await redisCouponStockRepository.getRemainingStock(couponId);
      expect(stock).toBe(0);
    });
  });

  describe('syncIssuedUsers - 발급 사용자 동기화', () => {
    it('발급 사용자를 Redis SET으로 저장해야 함', async () => {
      const couponId = 1;
      const userIds = [1, 2, 3, 4, 5];

      await redisCouponStockRepository.syncIssuedUsers(couponId, userIds);

      // 각 사용자가 SET에 존재하는지 확인
      for (const userId of userIds) {
        const hasIssued = await redisCouponStockRepository.hasUserIssued(
          userId,
          couponId,
        );
        expect(hasIssued).toBe(true);
      }

      // 없는 사용자는 false
      const hasIssued = await redisCouponStockRepository.hasUserIssued(
        999,
        couponId,
      );
      expect(hasIssued).toBe(false);
    });

    it('빈 배열 동기화 시 SET이 비어있어야 함', async () => {
      const couponId = 3;

      await redisCouponStockRepository.syncIssuedUsers(couponId, []);

      const hasIssued = await redisCouponStockRepository.hasUserIssued(
        1,
        couponId,
      );
      expect(hasIssued).toBe(false);
    });
  });

  describe('cacheMetadata - 메타데이터 캐싱', () => {
    it('메타데이터를 Redis HASH로 저장해야 함', async () => {
      const couponId = 1;
      const metadata = {
        isActive: true,
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
        issueLimit: 100,
      };

      await redisCouponStockRepository.cacheMetadata(couponId, metadata);

      const cached = await redisCouponStockRepository.getMetadata(couponId);
      expect(cached).not.toBeNull();
      expect(cached?.isActive).toBe(true);
      expect(cached?.validFrom).toBe('2024-01-01T00:00:00Z');
      expect(cached?.validUntil).toBe('2024-12-31T23:59:59Z');
      expect(cached?.issueLimit).toBe(100);
    });

    it('isActive false도 정상적으로 저장해야 함', async () => {
      const couponId = 2;
      const metadata = {
        isActive: false,
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
        issueLimit: 50,
      };

      await redisCouponStockRepository.cacheMetadata(couponId, metadata);

      const cached = await redisCouponStockRepository.getMetadata(couponId);
      expect(cached?.isActive).toBe(false);
    });
  });

  describe('tryIssue - 발급 시도', () => {
    it('정상 발급 시 SUCCESS 반환 및 재고 차감', async () => {
      const couponId = 1;
      const userId = 100;

      // 초기 재고 설정
      await redisCouponStockRepository.syncStock(couponId, 10);
      await redisCouponStockRepository.syncIssuedUsers(couponId, []);

      const result = await redisCouponStockRepository.tryIssue(
        userId,
        couponId,
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.remainingStock).toBe(9);

      // 재고 확인
      const stock =
        await redisCouponStockRepository.getRemainingStock(couponId);
      expect(stock).toBe(9);

      // 발급 사용자 확인
      const hasIssued = await redisCouponStockRepository.hasUserIssued(
        userId,
        couponId,
      );
      expect(hasIssued).toBe(true);
    });

    it('이미 발급받은 사용자는 ALREADY_ISSUED 반환', async () => {
      const couponId = 2;
      const userId = 100;

      await redisCouponStockRepository.syncStock(couponId, 10);
      await redisCouponStockRepository.syncIssuedUsers(couponId, [userId]);

      const result = await redisCouponStockRepository.tryIssue(
        userId,
        couponId,
      );

      expect(result.status).toBe('ALREADY_ISSUED');
    });

    it('재고 없으면 OUT_OF_STOCK 반환', async () => {
      const couponId = 3;
      const userId = 100;

      await redisCouponStockRepository.syncStock(couponId, 0);
      await redisCouponStockRepository.syncIssuedUsers(couponId, []);

      const result = await redisCouponStockRepository.tryIssue(
        userId,
        couponId,
      );

      expect(result.status).toBe('OUT_OF_STOCK');
      expect(result.remainingStock).toBe(0);
    });

    it('쿠폰 데이터 없으면 COUPON_NOT_FOUND 반환', async () => {
      const couponId = 999; // 존재하지 않는 쿠폰
      const userId = 100;

      const result = await redisCouponStockRepository.tryIssue(
        userId,
        couponId,
      );

      expect(result.status).toBe('COUPON_NOT_FOUND');
    });

    it('동시 발급 시 재고 초과 방지 (race condition)', async () => {
      const couponId = 4;
      const stock = 5;

      await redisCouponStockRepository.syncStock(couponId, stock);
      await redisCouponStockRepository.syncIssuedUsers(couponId, []);

      // 10명이 동시 발급 시도
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          redisCouponStockRepository.tryIssue(i + 1, couponId),
        ),
      );

      const succeeded = results.filter((r) => r.status === 'SUCCESS').length;
      const outOfStock = results.filter(
        (r) => r.status === 'OUT_OF_STOCK',
      ).length;

      expect(succeeded).toBe(5);
      expect(outOfStock).toBe(5);

      // 최종 재고 확인
      const finalStock =
        await redisCouponStockRepository.getRemainingStock(couponId);
      expect(finalStock).toBe(0);
    });
  });

  describe('rollbackIssuance - 발급 롤백', () => {
    it('롤백 시 재고 복구 및 발급 사용자 제거', async () => {
      const couponId = 1;
      const userId = 100;

      // 발급 상태 설정
      await redisCouponStockRepository.syncStock(couponId, 9);
      await redisCouponStockRepository.syncIssuedUsers(couponId, [userId]);

      // 롤백 실행
      await redisCouponStockRepository.rollbackIssuance(userId, couponId);

      // 재고 복구 확인
      const stock =
        await redisCouponStockRepository.getRemainingStock(couponId);
      expect(stock).toBe(10);

      // 발급 사용자 제거 확인
      const hasIssued = await redisCouponStockRepository.hasUserIssued(
        userId,
        couponId,
      );
      expect(hasIssued).toBe(false);
    });

    it('발급 후 롤백하면 원래 상태로 복구', async () => {
      const couponId = 2;
      const userId = 100;

      // 초기 상태
      await redisCouponStockRepository.syncStock(couponId, 10);
      await redisCouponStockRepository.syncIssuedUsers(couponId, []);

      // 발급
      const issueResult = await redisCouponStockRepository.tryIssue(
        userId,
        couponId,
      );
      expect(issueResult.status).toBe('SUCCESS');
      expect(issueResult.remainingStock).toBe(9);

      // 롤백
      await redisCouponStockRepository.rollbackIssuance(userId, couponId);

      // 원래 상태 확인
      const stock =
        await redisCouponStockRepository.getRemainingStock(couponId);
      expect(stock).toBe(10);

      const hasIssued = await redisCouponStockRepository.hasUserIssued(
        userId,
        couponId,
      );
      expect(hasIssued).toBe(false);
    });
  });

  describe('exists - 데이터 존재 확인', () => {
    it('재고 데이터 있으면 true 반환', async () => {
      const couponId = 1;
      await redisCouponStockRepository.syncStock(couponId, 10);

      const exists = await redisCouponStockRepository.exists(couponId);
      expect(exists).toBe(true);
    });

    it('재고 데이터 없으면 false 반환', async () => {
      const couponId = 999;

      const exists = await redisCouponStockRepository.exists(couponId);
      expect(exists).toBe(false);
    });
  });

  describe('removeCouponData - 데이터 삭제', () => {
    it('모든 쿠폰 관련 Redis 데이터 삭제', async () => {
      const couponId = 1;

      // 데이터 설정
      await redisCouponStockRepository.syncStock(couponId, 10);
      await redisCouponStockRepository.syncIssuedUsers(couponId, [1, 2, 3]);
      await redisCouponStockRepository.cacheMetadata(couponId, {
        isActive: true,
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        issueLimit: 100,
      });

      // 삭제
      await redisCouponStockRepository.removeCouponData(couponId);

      // 검증
      const exists = await redisCouponStockRepository.exists(couponId);
      expect(exists).toBe(false);

      const metadata = await redisCouponStockRepository.getMetadata(couponId);
      expect(metadata).toBeNull();
    });
  });
});
