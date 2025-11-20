import { PrismaClient } from '@prisma/client';

/**
 * 쿠폰 테스트 픽스처
 *
 * 테스트에 필요한 샘플 데이터 생성
 * - 사용자 데이터
 * - 쿠폰 데이터
 * - 사용자 쿠폰 데이터
 */
export class CouponTestFixture {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 테스트 사용자 생성
   */
  async createUser(data?: {
    loginId?: string;
    email?: string;
    name?: string;
    point?: number;
  }) {
    return await this.prisma.users.create({
      data: {
        login_id: data?.loginId ?? 'testuser',
        login_password: 'password123',
        email: data?.email ?? 'test@example.com',
        name: data?.name ?? '테스트유저',
        display_name: '테스터',
        phone_number: '010-1234-5678',
        point: data?.point ?? 100000, // Decimal 타입이므로 number 그대로 전달
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * 테스트 쿠폰 생성
   */
  async createCoupon(data?: {
    couponName?: string;
    couponCode?: string;
    discountRate?: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    issueLimit?: number;
    issuedCount?: number;
    validFrom?: Date;
    validUntil?: Date;
    isActive?: boolean;
  }) {
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return await this.prisma.coupons.create({
      data: {
        coupon_name: data?.couponName ?? '신규가입 10% 할인쿠폰',
        coupon_code: data?.couponCode ?? `COUPON${Date.now()}`,
        coupon_description: '신규 회원 전용 할인 쿠폰',
        discount_rate: data?.discountRate ?? 10.0,
        max_discount_amount: data?.maxDiscountAmount ?? 10000,
        min_order_amount: data?.minOrderAmount ?? 50000,
        issue_limit: data?.issueLimit ?? 100,
        issued_count: data?.issuedCount ?? 0,
        valid_from: data?.validFrom ?? now,
        valid_until: data?.validUntil ?? oneMonthLater,
        is_active: data?.isActive ?? true,
        created_at: now,
        updated_at: now,
      },
    });
  }

  /**
   * 사용자 쿠폰 생성 (이미 발급된 쿠폰)
   */
  async createUserCoupon(data: {
    userId: bigint;
    couponId: bigint;
    status?: string;
    usedOrderId?: bigint | null;
    usedAt?: Date | null;
  }) {
    const now = new Date();

    return await this.prisma.user_coupons.create({
      data: {
        user_id: data.userId,
        coupon_id: data.couponId,
        status: data.status ?? 'UNUSED',
        used_order_id: data.usedOrderId ?? null,
        issued_at: now,
        used_at: data.usedAt ?? null,
      },
    });
  }

  /**
   * 선착순 쿠폰 시나리오 데이터 생성
   * - 발급 한도가 거의 찬 쿠폰
   */
  async createLimitedCoupon() {
    return await this.createCoupon({
      couponName: '한정수량 쿠폰',
      couponCode: `LIMITED${Date.now()}`,
      discountRate: 20.0,
      issueLimit: 10,
      issuedCount: 9, // 1개만 남음
    });
  }

  /**
   * 만료된 쿠폰 생성
   */
  async createExpiredCoupon() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return await this.createCoupon({
      couponName: '만료된 쿠폰',
      couponCode: `EXPIRED${Date.now()}`,
      validFrom: lastWeek,
      validUntil: yesterday,
    });
  }

  /**
   * 아직 시작되지 않은 쿠폰 생성
   */
  async createNotStartedCoupon() {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return await this.createCoupon({
      couponName: '예정된 쿠폰',
      couponCode: `FUTURE${Date.now()}`,
      validFrom: tomorrow,
      validUntil: nextMonth,
    });
  }

  /**
   * 비활성화된 쿠폰 생성
   */
  async createInactiveCoupon() {
    return await this.createCoupon({
      couponName: '비활성 쿠폰',
      couponCode: `INACTIVE${Date.now()}`,
      isActive: false,
    });
  }

  /**
   * 다양한 할인율 쿠폰 생성
   */
  async createCouponsWithVariousDiscounts() {
    const coupons = [];

    // 10% 할인
    coupons.push(
      await this.createCoupon({
        couponName: '10% 할인쿠폰',
        couponCode: `DISCOUNT10_${Date.now()}`,
        discountRate: 10.0,
        maxDiscountAmount: 5000,
        minOrderAmount: 30000,
      }),
    );

    // 20% 할인
    coupons.push(
      await this.createCoupon({
        couponName: '20% 할인쿠폰',
        couponCode: `DISCOUNT20_${Date.now()}`,
        discountRate: 20.0,
        maxDiscountAmount: 10000,
        minOrderAmount: 50000,
      }),
    );

    // 50% 할인 (최소 주문금액 높음)
    coupons.push(
      await this.createCoupon({
        couponName: '50% 대박쿠폰',
        couponCode: `DISCOUNT50_${Date.now()}`,
        discountRate: 50.0,
        maxDiscountAmount: 50000,
        minOrderAmount: 100000,
      }),
    );

    return coupons;
  }

  /**
   * 완전한 쿠폰 발급 시나리오 데이터 생성
   * - 사용자 + 쿠폰 + 발급된 사용자 쿠폰
   */
  async createCompleteScenario() {
    const user = await this.createUser({
      loginId: 'scenario_user',
      email: 'scenario@example.com',
      name: '시나리오유저',
    });

    const coupon = await this.createCoupon({
      couponName: '시나리오 쿠폰',
      couponCode: `SCENARIO${Date.now()}`,
      issueLimit: 100,
      issuedCount: 1,
    });

    const userCoupon = await this.createUserCoupon({
      userId: user.id,
      couponId: coupon.id,
      status: 'UNUSED',
    });

    return { user, coupon, userCoupon };
  }
}
