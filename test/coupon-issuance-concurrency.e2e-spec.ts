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
 * 쿠폰 발급 동시성 테스트 (Redis 기반)
 *
 * 목적:
 * - Race Condition으로 인한 쿠폰 한도 초과 발급 방지 검증
 * - 동시 요청 상황에서 정확히 발급 한도만큼만 발급되는지 확인
 * - 중복 발급 방지 검증
 * - Redis + DB 정합성 검증
 *
 * 테스트 환경:
 * - TestContainer 기반 실제 MySQL 8.0 환경
 * - TestContainer 기반 실제 Redis 7 환경
 * - Mock 없이 실제 Prisma + Repository 사용
 * - Redis 기반 재고/중복 확인 + 분산락 사용
 */
describe('Coupon Issuance Concurrency with Redis (e2e)', () => {
  let prisma: PrismaClient;
  let fixture: CouponTestFixture;
  let couponRepository: PrismaCouponRepository;
  let userCouponRepository: PrismaUserCouponRepository;
  let redisCouponStockRepository: RedisCouponStockRepository;
  let couponDomainService: CouponDomainService;
  let couponStockSyncService: CouponStockSyncService;
  let distributedLockService: DistributedLockService;
  let couponIssuanceService: CouponIssuanceApplicationService;
  let issueCouponUseCase: IssueCouponUseCase;
  let couponMapper: CouponMapper;

  beforeAll(async () => {
    // TestContainer 기반 MySQL + Redis 시작
    prisma = await TestDatabaseHelper.setup();
    fixture = new CouponTestFixture(prisma);

    // Repository 직접 인스턴스화
    couponRepository = new PrismaCouponRepository(prisma as any);
    userCouponRepository = new PrismaUserCouponRepository(prisma as any);

    // Redis 연결 정보 가져오기
    const redisConfig = TestDatabaseHelper.getRedisConfig();

    // ConfigService 모킹 (Redis 연결 정보 포함)
    const configService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return redisConfig.host;
        if (key === 'REDIS_PORT') return redisConfig.port;
        return defaultValue;
      },
    } as any;

    // PrismaService 모킹 (transaction 메서드 포함)
    const prismaService = {
      transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
        return await prisma.$transaction(fn);
      },
      client: prisma,
    } as any;

    // Redis Repository 인스턴스화
    redisCouponStockRepository = new RedisCouponStockRepository(configService);

    // 실제 DistributedLockService 인스턴스화
    distributedLockService = new DistributedLockService(configService);

    // Domain Service 인스턴스화
    couponDomainService = new CouponDomainService(
      couponRepository,
      userCouponRepository,
    );

    // Sync Service 인스턴스화 (OnModuleInit은 수동 호출하지 않음)
    couponStockSyncService = new CouponStockSyncService(
      couponRepository,
      userCouponRepository,
      redisCouponStockRepository,
    );

    // Mapper 인스턴스화
    couponMapper = new CouponMapper();

    // Application Service 인스턴스화
    couponIssuanceService = new CouponIssuanceApplicationService(
      couponDomainService,
      redisCouponStockRepository,
      couponStockSyncService,
      prismaService,
      distributedLockService,
    );

    // UseCase 인스턴스화
    issueCouponUseCase = new IssueCouponUseCase(
      couponIssuanceService,
      couponDomainService,
      couponMapper,
    );
  }, 60000);

  afterAll(async () => {
    // Redis Repository 정리
    if (redisCouponStockRepository) {
      await redisCouponStockRepository.onModuleDestroy();
    }

    // DistributedLockService 정리
    if (distributedLockService) {
      await distributedLockService.onModuleDestroy();
    }

    // TestContainer 정리
    await TestDatabaseHelper.teardown();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터 초기화 (DB + Redis)
    await TestDatabaseHelper.cleanup();
  });

  describe('발급 한도 초과 방지 (Redis 기반)', () => {
    it('동시에 100명이 요청해도 발급 한도(100개)를 초과하지 않아야 함', async () => {
      // Given: 발급 한도 100개인 쿠폰 생성
      const coupon = await fixture.createCoupon({
        couponName: '선착순 100명 쿠폰',
        couponCode: 'CONCURRENT100',
        issueLimit: 100,
        issuedCount: 0,
      });

      // Redis 동기화
      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      // 100명의 사용자 생성
      const users = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          }),
        ),
      );

      // When: 100명이 동시에 쿠폰 발급 요청
      const results = await Promise.allSettled(
        users.map((user) =>
          issueCouponUseCase.execute(Number(user.id), Number(coupon.id)),
        ),
      );

      // Then: 정확히 100개만 성공
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(100);
      expect(failed).toBe(0);

      // 최종 발급 카운트 확인
      const finalCoupon = await prisma.coupons.findUnique({
        where: { id: coupon.id },
      });
      expect(finalCoupon?.issued_count).toBe(100);

      // 실제 발급된 user_coupons 개수 확인
      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id },
      });
      expect(userCouponsCount).toBe(100);

      // Redis 재고 확인
      const remainingStock = await redisCouponStockRepository.getRemainingStock(
        Number(coupon.id),
      );
      expect(remainingStock).toBe(0);
    }, 30000);

    it('동시에 150명이 요청하면 100개만 성공하고 50개는 실패해야 함', async () => {
      // Given: 발급 한도 100개인 쿠폰 생성
      const coupon = await fixture.createCoupon({
        couponName: '선착순 100명 쿠폰',
        couponCode: 'CONCURRENT150',
        issueLimit: 100,
        issuedCount: 0,
      });

      // Redis 동기화
      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      // 150명의 사용자 생성
      const users = await Promise.all(
        Array.from({ length: 150 }, (_, i) =>
          fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          }),
        ),
      );

      // When: 150명이 동시에 쿠폰 발급 요청
      const results = await Promise.allSettled(
        users.map((user) =>
          issueCouponUseCase.execute(Number(user.id), Number(coupon.id)),
        ),
      );

      // Then: 정확히 100개만 성공, 50개는 실패
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(100);
      expect(failed).toBe(50);

      // 최종 발급 카운트 확인
      const finalCoupon = await prisma.coupons.findUnique({
        where: { id: coupon.id },
      });
      expect(finalCoupon?.issued_count).toBe(100);

      // 실제 발급된 user_coupons 개수 확인
      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id },
      });
      expect(userCouponsCount).toBe(100);

      // Redis 재고 확인
      const remainingStock = await redisCouponStockRepository.getRemainingStock(
        Number(coupon.id),
      );
      expect(remainingStock).toBe(0);
    }, 30000);

    it('발급 한도가 거의 찬 상황에서 동시 요청 시 정확히 남은 개수만큼만 발급', async () => {
      // Given: 발급 한도 100개 중 95개 이미 발급된 쿠폰
      const coupon = await fixture.createCoupon({
        couponName: '거의 마감 쿠폰',
        couponCode: 'ALMOSTFULL',
        issueLimit: 100,
        issuedCount: 95,
      });

      // 기존 발급자 95명 생성
      const existingUsers = await Promise.all(
        Array.from({ length: 95 }, (_, i) =>
          fixture.createUser({
            loginId: `existing${i}`,
            email: `existing${i}@test.com`,
            name: `기존사용자${i}`,
          }),
        ),
      );

      await Promise.all(
        existingUsers.map((user) =>
          fixture.createUserCoupon({
            userId: user.id,
            couponId: coupon.id,
            status: 'UNUSED',
          }),
        ),
      );

      // Redis 동기화 (기존 발급자 포함)
      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      // 새로운 10명의 사용자 생성
      const newUsers = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          fixture.createUser({
            loginId: `new${i}`,
            email: `new${i}@test.com`,
            name: `신규사용자${i}`,
          }),
        ),
      );

      // When: 10명이 동시에 쿠폰 발급 요청 (실제로는 5개만 남음)
      const results = await Promise.allSettled(
        newUsers.map((user) =>
          issueCouponUseCase.execute(Number(user.id), Number(coupon.id)),
        ),
      );

      // Then: 정확히 5개만 성공, 5개는 실패
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(5);
      expect(failed).toBe(5);

      // 최종 발급 카운트 확인
      const finalCoupon = await prisma.coupons.findUnique({
        where: { id: coupon.id },
      });
      expect(finalCoupon?.issued_count).toBe(100);

      // 실제 발급된 user_coupons 개수 확인
      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id },
      });
      expect(userCouponsCount).toBe(100);
    }, 30000);
  });

  describe('중복 발급 방지 (Redis SET 기반)', () => {
    it('동일 사용자가 동시에 여러 번 요청해도 1번만 발급되어야 함', async () => {
      // Given: 발급 한도 100개인 쿠폰과 1명의 사용자
      const coupon = await fixture.createCoupon({
        couponName: '중복 방지 쿠폰',
        couponCode: 'NODUPLICATE',
        issueLimit: 100,
        issuedCount: 0,
      });

      // Redis 동기화
      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      const user = await fixture.createUser({
        loginId: 'duplicate_user',
        email: 'duplicate@test.com',
        name: '중복요청자',
      });

      // When: 동일 사용자가 10번 동시 요청
      const results = await Promise.allSettled(
        Array.from({ length: 10 }, () =>
          issueCouponUseCase.execute(Number(user.id), Number(coupon.id)),
        ),
      );

      // Then: 1번만 성공, 9번은 실패
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(1);
      expect(failed).toBe(9);

      // 실제 발급된 user_coupons 개수 확인
      const userCouponsCount = await prisma.user_coupons.count({
        where: {
          coupon_id: coupon.id,
          user_id: user.id,
        },
      });
      expect(userCouponsCount).toBe(1);

      // Redis에서 사용자 발급 여부 확인
      const hasIssued = await redisCouponStockRepository.hasUserIssued(
        Number(user.id),
        Number(coupon.id),
      );
      expect(hasIssued).toBe(true);
    }, 30000);

    it('여러 사용자가 동시 요청 시 각 사용자당 1개씩만 발급되어야 함', async () => {
      // Given: 쿠폰과 50명의 사용자
      const coupon = await fixture.createCoupon({
        couponName: '사용자별 1개 제한',
        couponCode: 'ONEPERUSER',
        issueLimit: 100,
        issuedCount: 0,
      });

      // Redis 동기화
      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      const users = await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          }),
        ),
      );

      // When: 각 사용자가 2번씩 요청 (총 100개 요청)
      const requests = users.flatMap((user) => [
        issueCouponUseCase.execute(Number(user.id), Number(coupon.id)),
        issueCouponUseCase.execute(Number(user.id), Number(coupon.id)),
      ]);

      const results = await Promise.allSettled(requests);

      // Then: 정확히 50개만 성공 (각 사용자당 1개)
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(50);
      expect(failed).toBe(50);

      // 각 사용자별로 1개씩만 발급되었는지 확인
      for (const user of users) {
        const userCouponsCount = await prisma.user_coupons.count({
          where: {
            coupon_id: coupon.id,
            user_id: user.id,
          },
        });
        expect(userCouponsCount).toBe(1);
      }
    }, 30000);
  });

  describe('Redis-DB 데이터 정합성 검증', () => {
    it('동시 발급 후 Redis 재고와 DB issued_count가 일치해야 함', async () => {
      // Given: 쿠폰과 사용자들
      const coupon = await fixture.createCoupon({
        couponName: '정합성 검증',
        couponCode: 'CONSISTENCY',
        issueLimit: 50,
        issuedCount: 0,
      });

      // Redis 동기화
      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      const users = await Promise.all(
        Array.from({ length: 75 }, (_, i) =>
          fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          }),
        ),
      );

      // When: 75명이 동시 요청 (50명만 성공해야 함)
      await Promise.allSettled(
        users.map((user) =>
          issueCouponUseCase.execute(Number(user.id), Number(coupon.id)),
        ),
      );

      // Then: DB issued_count, user_coupons, Redis 재고 모두 일치
      const finalCoupon = await prisma.coupons.findUnique({
        where: { id: coupon.id },
      });

      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id },
      });

      const redisRemainingStock =
        await redisCouponStockRepository.getRemainingStock(Number(coupon.id));

      // 정합성 검증
      expect(finalCoupon?.issued_count).toBe(50);
      expect(userCouponsCount).toBe(50);
      expect(redisRemainingStock).toBe(0);

      // DB issued_count + Redis remaining = issue_limit
      expect(
        Number(finalCoupon?.issued_count) + (redisRemainingStock ?? 0),
      ).toBe(50);
    }, 30000);

    it('Redis 발급 사용자 SET과 DB user_coupons가 일치해야 함', async () => {
      // Given: 쿠폰과 사용자들
      const coupon = await fixture.createCoupon({
        couponName: '사용자 정합성',
        couponCode: 'USERCONSISTENCY',
        issueLimit: 30,
        issuedCount: 0,
      });

      // Redis 동기화
      const couponEntity = await couponRepository.findById(Number(coupon.id));
      await couponStockSyncService.syncCoupon(couponEntity!);

      const users = await Promise.all(
        Array.from({ length: 30 }, (_, i) =>
          fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          }),
        ),
      );

      // When: 30명이 동시 발급 요청
      await Promise.allSettled(
        users.map((user) =>
          issueCouponUseCase.execute(Number(user.id), Number(coupon.id)),
        ),
      );

      // Then: 모든 발급된 사용자가 Redis SET에도 존재
      const dbUserCoupons = await prisma.user_coupons.findMany({
        where: { coupon_id: coupon.id },
        select: { user_id: true },
      });

      for (const uc of dbUserCoupons) {
        const hasIssued = await redisCouponStockRepository.hasUserIssued(
          Number(uc.user_id),
          Number(coupon.id),
        );
        expect(hasIssued).toBe(true);
      }
    }, 30000);
  });
});
