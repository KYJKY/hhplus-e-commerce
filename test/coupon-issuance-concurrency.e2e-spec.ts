import { PrismaClient } from '@prisma/client';
import { TestDatabaseHelper } from './helpers/test-database.helper';
import { CouponTestFixture } from './helpers/coupon-test.fixture';
import { PrismaCouponRepository } from '../src/modules/coupon/infrastructure/repositories/prisma-coupon.repository';
import { PrismaUserCouponRepository } from '../src/modules/coupon/infrastructure/repositories/prisma-user-coupon.repository';
import { CouponDomainService } from '../src/modules/coupon/domain/services/coupon-domain.service';

/**
 * 쿠폰 발급 동시성 테스트
 *
 * 목적:
 * - Race Condition으로 인한 쿠폰 한도 초과 발급 방지 검증
 * - 동시 요청 상황에서 정확히 발급 한도만큼만 발급되는지 확인
 * - 중복 발급 방지 검증
 *
 * 테스트 환경:
 * - TestContainer 기반 실제 MySQL 8.0 환경
 * - Mock 없이 실제 Prisma + Repository 사용
 */
describe('Coupon Issuance Concurrency (e2e)', () => {
  let prisma: PrismaClient;
  let fixture: CouponTestFixture;
  let couponRepository: PrismaCouponRepository;
  let userCouponRepository: PrismaUserCouponRepository;
  let couponDomainService: CouponDomainService;

  beforeAll(async () => {
    // TestContainer 기반 MySQL 시작
    prisma = await TestDatabaseHelper.setup();
    fixture = new CouponTestFixture(prisma);

    // Repository 직접 인스턴스화
    couponRepository = new PrismaCouponRepository(prisma as any);
    userCouponRepository = new PrismaUserCouponRepository(prisma as any);

    // Domain Service 직접 인스턴스화
    couponDomainService = new CouponDomainService(
      couponRepository,
      userCouponRepository,
    );
  }, 60000); // 타임아웃 60초

  afterAll(async () => {
    await TestDatabaseHelper.teardown();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터 초기화
    await TestDatabaseHelper.cleanup();
  });

  describe('발급 한도 초과 방지', () => {
    it('동시에 100명이 요청해도 발급 한도(100개)를 초과하지 않아야 함', async () => {
      // Given: 발급 한도 100개인 쿠폰 생성
      const coupon = await fixture.createCoupon({
        couponName: '선착순 100명 쿠폰',
        couponCode: 'CONCURRENT100',
        issueLimit: 100,
        issuedCount: 0,
      });

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
          couponDomainService.issueCoupon(Number(user.id), Number(coupon.id)),
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
    }, 30000); // 타임아웃 30초

    it('동시에 150명이 요청하면 100개만 성공하고 50개는 실패해야 함 (한도 초과 방지)', async () => {
      // Given: 발급 한도 100개인 쿠폰 생성
      const coupon = await fixture.createCoupon({
        couponName: '선착순 100명 쿠폰',
        couponCode: 'CONCURRENT150',
        issueLimit: 100,
        issuedCount: 0,
      });

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
          couponDomainService.issueCoupon(Number(user.id), Number(coupon.id)),
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
      expect(finalCoupon?.issued_count).toBeLessThanOrEqual(
        finalCoupon?.issue_limit || 0,
      );

      // 실제 발급된 user_coupons 개수 확인
      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id },
      });
      expect(userCouponsCount).toBe(100);
    }, 30000);

    it('발급 한도가 거의 찬 상황에서 동시 요청 시 정확히 남은 개수만큼만 발급되어야 함', async () => {
      // Given: 발급 한도 100개 중 95개 이미 발급된 쿠폰
      const coupon = await fixture.createCoupon({
        couponName: '거의 마감 쿠폰',
        couponCode: 'ALMOST_FULL',
        issueLimit: 100,
        issuedCount: 95,
      });

      // 기존 발급자 95명 생성 (issued_count와 실제 데이터 일치시키기)
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
          couponDomainService.issueCoupon(Number(user.id), Number(coupon.id)),
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
      expect(finalCoupon?.issued_count).toBe(finalCoupon?.issue_limit);

      // 실제 발급된 user_coupons 개수 확인
      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id },
      });
      expect(userCouponsCount).toBe(100);
    }, 30000);
  });

  describe('중복 발급 방지', () => {
    it('동일 사용자가 동시에 여러 번 요청해도 1번만 발급되어야 함', async () => {
      // Given: 발급 한도 100개인 쿠폰과 1명의 사용자
      const coupon = await fixture.createCoupon({
        couponName: '중복 방지 쿠폰',
        couponCode: 'NO_DUPLICATE',
        issueLimit: 100,
        issuedCount: 0,
      });

      const user = await fixture.createUser({
        loginId: 'duplicate_user',
        email: 'duplicate@test.com',
        name: '중복요청자',
      });

      // When: 동일 사용자가 10번 동시 요청
      const results = await Promise.allSettled(
        Array.from({ length: 10 }, () =>
          couponDomainService.issueCoupon(Number(user.id), Number(coupon.id)),
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

      // 쿠폰 발급 카운트 확인
      const finalCoupon = await prisma.coupons.findUnique({
        where: { id: coupon.id },
      });
      expect(finalCoupon?.issued_count).toBe(1);
    }, 30000);

    it('여러 사용자가 동시 요청 시 각 사용자당 1개씩만 발급되어야 함', async () => {
      // Given: 쿠폰과 50명의 사용자
      const coupon = await fixture.createCoupon({
        couponName: '사용자별 1개 제한',
        couponCode: 'ONE_PER_USER',
        issueLimit: 100,
        issuedCount: 0,
      });

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
        couponDomainService.issueCoupon(Number(user.id), Number(coupon.id)),
        couponDomainService.issueCoupon(Number(user.id), Number(coupon.id)),
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

      // 최종 발급 카운트 확인
      const finalCoupon = await prisma.coupons.findUnique({
        where: { id: coupon.id },
      });
      expect(finalCoupon?.issued_count).toBe(50);
    }, 30000);
  });

  describe('데이터 정합성 검증', () => {
    it('동시 발급 후 issued_count와 실제 user_coupons 개수가 일치해야 함', async () => {
      // Given: 쿠폰과 사용자들
      const coupon = await fixture.createCoupon({
        couponName: '데이터 정합성 검증',
        couponCode: 'DATA_CONSISTENCY',
        issueLimit: 50,
        issuedCount: 0,
      });

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
          couponDomainService.issueCoupon(Number(user.id), Number(coupon.id)),
        ),
      );

      // Then: issued_count와 실제 user_coupons 개수 일치
      const finalCoupon = await prisma.coupons.findUnique({
        where: { id: coupon.id },
      });

      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id },
      });

      expect(finalCoupon?.issued_count).toBe(userCouponsCount);
      expect(finalCoupon?.issued_count).toBe(50);
      expect(userCouponsCount).toBe(50);
    }, 30000);

    it('부분 실패 시에도 issued_count와 user_coupons가 정확히 일치해야 함', async () => {
      // Given: 한도 20개 쿠폰과 30명의 사용자
      const coupon = await fixture.createCoupon({
        couponName: '부분 실패 검증',
        couponCode: 'PARTIAL_FAILURE',
        issueLimit: 20,
        issuedCount: 0,
      });

      const users = await Promise.all(
        Array.from({ length: 30 }, (_, i) =>
          fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          }),
        ),
      );

      // When: 30명이 동시 요청
      const results = await Promise.allSettled(
        users.map((user) =>
          couponDomainService.issueCoupon(Number(user.id), Number(coupon.id)),
        ),
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      // Then: 20개 성공, 10개 실패
      expect(succeeded).toBe(20);
      expect(failed).toBe(10);

      // 데이터 정합성 확인
      const finalCoupon = await prisma.coupons.findUnique({
        where: { id: coupon.id },
      });

      const userCouponsCount = await prisma.user_coupons.count({
        where: { coupon_id: coupon.id },
      });

      // issued_count, user_coupons 개수, 성공 개수 모두 일치
      expect(finalCoupon?.issued_count).toBe(20);
      expect(userCouponsCount).toBe(20);
      expect(succeeded).toBe(20);

      // 한도 초과하지 않음
      expect(finalCoupon?.issued_count).toBeLessThanOrEqual(
        finalCoupon?.issue_limit || 0,
      );
    }, 30000);
  });
});
