import { PrismaClient } from '@prisma/client';
import { TestDatabaseHelper } from './helpers/test-database.helper';
import { CouponTestFixture } from './helpers/coupon-test.fixture';
import { PrismaCouponRepository } from '../src/modules/coupon/infrastructure/repositories/prisma-coupon.repository';
import { PrismaUserCouponRepository } from '../src/modules/coupon/infrastructure/repositories/prisma-user-coupon.repository';
import { RedisCouponStockRepository } from '../src/modules/coupon/infrastructure/repositories/redis-coupon-stock.repository';
import { CouponDomainService } from '../src/modules/coupon/domain/services/coupon-domain.service';
import { CouponStockSyncService } from '../src/modules/coupon/infrastructure/services/coupon-stock-sync.service';
import { CouponIssuanceApplicationService } from '../src/modules/coupon/application/services/coupon-issuance-app.service';
import { IssueCouponUseCase } from '../src/modules/coupon/application/use-cases/issue-coupon.use-case';
import { CouponMapper } from '../src/modules/coupon/application/mappers/coupon.mapper';
import { DistributedLockService } from '../src/common/redis/distributed-lock.service';

/**
 * 쿠폰 발급 롤백 시나리오 테스트
 *
 * 목적:
 * - DB 저장 실패 시 Redis 롤백 동작 검증
 * - Redis-DB 정합성 유지 검증
 *
 * 테스트 환경:
 * - TestContainer 기반 MySQL 8.0 + Redis 7
 * - PrismaService Mock을 통한 DB 실패 시뮬레이션
 */
describe('Coupon Issuance Rollback Scenarios (e2e)', () => {
  let prisma: PrismaClient;
  let fixture: CouponTestFixture;
  let couponRepository: PrismaCouponRepository;
  let userCouponRepository: PrismaUserCouponRepository;
  let redisCouponStockRepository: RedisCouponStockRepository;
  let couponDomainService: CouponDomainService;
  let couponStockSyncService: CouponStockSyncService;
  let distributedLockService: DistributedLockService;
  let couponMapper: CouponMapper;

  beforeAll(async () => {
    prisma = await TestDatabaseHelper.setup();
    fixture = new CouponTestFixture(prisma);

    couponRepository = new PrismaCouponRepository(prisma as any);
    userCouponRepository = new PrismaUserCouponRepository(prisma as any);

    const redisConfig = TestDatabaseHelper.getRedisConfig();

    const configService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return redisConfig.host;
        if (key === 'REDIS_PORT') return redisConfig.port;
        return defaultValue;
      },
    } as any;

    redisCouponStockRepository = new RedisCouponStockRepository(configService);
    distributedLockService = new DistributedLockService(configService);

    couponDomainService = new CouponDomainService(
      couponRepository,
      userCouponRepository,
    );

    couponStockSyncService = new CouponStockSyncService(
      couponRepository,
      userCouponRepository,
      redisCouponStockRepository,
    );

    couponMapper = new CouponMapper();
  }, 60000);

  afterAll(async () => {
    if (redisCouponStockRepository) {
      await redisCouponStockRepository.onModuleDestroy();
    }
    if (distributedLockService) {
      await distributedLockService.onModuleDestroy();
    }
    await TestDatabaseHelper.teardown();
  });

  beforeEach(async () => {
    await TestDatabaseHelper.cleanup();
  });

  describe('DB 저장 실패 시 Redis 롤백', () => {
    it('DB 트랜잭션 실패 시 Redis 재고와 발급 사용자가 복구되어야 함', async () => {
      // Given: 쿠폰과 사용자 생성
      const coupon = await fixture.createCoupon({
        couponName: '롤백 테스트 쿠폰',
        couponCode: 'ROLLBACK',
        issueLimit: 10,
        issuedCount: 0,
      });

      const user = await fixture.createUser({
        loginId: 'rollback_user',
        email: 'rollback@test.com',
        name: '롤백테스터',
      });

      // Redis 동기화
      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      // 초기 Redis 상태 확인
      const initialStock = await redisCouponStockRepository.getRemainingStock(
        Number(coupon.id),
      );
      expect(initialStock).toBe(10);

      // 실패하는 PrismaService Mock 생성
      const failingPrismaService = {
        transaction: async () => {
          throw new Error('DB Connection Error - Simulated Failure');
        },
      } as any;

      // 실패하는 Application Service 인스턴스화
      const failingIssuanceService = new CouponIssuanceApplicationService(
        couponDomainService,
        redisCouponStockRepository,
        couponStockSyncService,
        failingPrismaService,
        distributedLockService,
      );

      // 실패하는 UseCase 인스턴스화
      const failingUseCase = new IssueCouponUseCase(
        failingIssuanceService,
        couponDomainService,
        couponMapper,
      );

      // When: 발급 시도 (DB 실패로 예외 발생 예상)
      await expect(
        failingUseCase.execute(Number(user.id), Number(coupon.id)),
      ).rejects.toThrow('DB Connection Error');

      // Then: Redis 상태가 롤백되어 원래대로 복구
      const finalStock = await redisCouponStockRepository.getRemainingStock(
        Number(coupon.id),
      );
      expect(finalStock).toBe(10); // 재고 복구됨

      const hasIssued = await redisCouponStockRepository.hasUserIssued(
        Number(user.id),
        Number(coupon.id),
      );
      expect(hasIssued).toBe(false); // 발급 사용자 제거됨

      // DB에도 저장되지 않음
      const userCouponsCount = await prisma.user_coupons.count({
        where: {
          coupon_id: coupon.id,
          user_id: user.id,
        },
      });
      expect(userCouponsCount).toBe(0);
    }, 30000);

    it('부분 성공/실패 시 성공한 발급만 유지되어야 함', async () => {
      // Given: 쿠폰과 사용자들 생성
      const coupon = await fixture.createCoupon({
        couponName: '부분 실패 쿠폰',
        couponCode: 'PARTIAL',
        issueLimit: 10,
        issuedCount: 0,
      });

      const users = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          fixture.createUser({
            loginId: `partial_user${i}`,
            email: `partial${i}@test.com`,
            name: `부분테스터${i}`,
          }),
        ),
      );

      // Redis 동기화
      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      // 첫 2번 호출만 성공하는 PrismaService
      let callCount = 0;
      const partialFailPrismaService = {
        transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
          callCount++;
          if (callCount > 2) {
            throw new Error('Simulated DB Failure');
          }
          return await prisma.$transaction(fn);
        },
      } as any;

      // 부분 실패 Application Service
      const partialFailIssuanceService = new CouponIssuanceApplicationService(
        couponDomainService,
        redisCouponStockRepository,
        couponStockSyncService,
        partialFailPrismaService,
        distributedLockService,
      );

      const partialFailUseCase = new IssueCouponUseCase(
        partialFailIssuanceService,
        couponDomainService,
        couponMapper,
      );

      // When: 첫 2명은 성공, 나머지 3명은 실패 (순차 실행으로 callCount 순서 보장)
      const results: PromiseSettledResult<any>[] = [];
      for (const user of users) {
        const result = await Promise.allSettled([
          partialFailUseCase.execute(Number(user.id), Number(coupon.id)),
        ]);
        results.push(result[0]);
      }

      // Then: 성공/실패 확인
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      expect(succeeded).toBe(2);

      // DB에 2개만 저장됨
      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id },
      });
      expect(userCouponsCount).toBe(2);

      // Redis 재고 = 10 - 2 = 8
      const finalStock = await redisCouponStockRepository.getRemainingStock(
        Number(coupon.id),
      );
      expect(finalStock).toBe(8);

      // 성공한 사용자만 Redis SET에 존재
      const user0Issued = await redisCouponStockRepository.hasUserIssued(
        Number(users[0].id),
        Number(coupon.id),
      );
      const user1Issued = await redisCouponStockRepository.hasUserIssued(
        Number(users[1].id),
        Number(coupon.id),
      );
      const user2Issued = await redisCouponStockRepository.hasUserIssued(
        Number(users[2].id),
        Number(coupon.id),
      );
      expect(user0Issued).toBe(true);
      expect(user1Issued).toBe(true);
      expect(user2Issued).toBe(false); // 롤백되어야 함
    }, 30000);
  });

  describe('Redis-DB 정합성 복구', () => {
    it('롤백 후 재시도하면 정상 발급되어야 함', async () => {
      // Given
      const coupon = await fixture.createCoupon({
        couponName: '재시도 쿠폰',
        couponCode: 'RETRY',
        issueLimit: 10,
        issuedCount: 0,
      });

      const user = await fixture.createUser({
        loginId: 'retry_user',
        email: 'retry@test.com',
        name: '재시도유저',
      });

      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      // 1차: 실패하는 UseCase
      let shouldFail = true;
      const retryPrismaService = {
        transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
          if (shouldFail) {
            throw new Error('Temporary DB Error');
          }
          return await prisma.$transaction(fn);
        },
      } as any;

      // 재시도용 Application Service
      const retryIssuanceService = new CouponIssuanceApplicationService(
        couponDomainService,
        redisCouponStockRepository,
        couponStockSyncService,
        retryPrismaService,
        distributedLockService,
      );

      const retryUseCase = new IssueCouponUseCase(
        retryIssuanceService,
        couponDomainService,
        couponMapper,
      );

      // 1차 시도: 실패
      await expect(
        retryUseCase.execute(Number(user.id), Number(coupon.id)),
      ).rejects.toThrow('Temporary DB Error');

      // 롤백 확인
      const stockAfterFail = await redisCouponStockRepository.getRemainingStock(
        Number(coupon.id),
      );
      expect(stockAfterFail).toBe(10);

      // 2차: 성공하도록 변경
      shouldFail = false;

      // 2차 시도: 성공
      const result = await retryUseCase.execute(
        Number(user.id),
        Number(coupon.id),
      );
      expect(result).toBeDefined();
      expect(result.userId).toBe(Number(user.id));

      // 최종 상태 확인
      const finalStock = await redisCouponStockRepository.getRemainingStock(
        Number(coupon.id),
      );
      expect(finalStock).toBe(9);

      const hasIssued = await redisCouponStockRepository.hasUserIssued(
        Number(user.id),
        Number(coupon.id),
      );
      expect(hasIssued).toBe(true);

      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id, user_id: user.id },
      });
      expect(userCouponsCount).toBe(1);
    }, 30000);
  });
});
