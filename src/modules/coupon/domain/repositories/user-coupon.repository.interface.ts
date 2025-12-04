import { UserCoupon, UserCouponStatus } from '../entities/user-coupon.entity';

/**
 * 사용자 쿠폰 목록 조회 필터
 */
export interface UserCouponListFilter {
  userId?: number;
  couponId?: number;
  status?: UserCouponStatus;
}

/**
 * UserCoupon Repository 인터페이스
 *
 * 사용자 쿠폰 데이터 접근 계층 추상화
 */
export interface IUserCouponRepository {
  /**
   * ID로 사용자 쿠폰 조회
   */
  findById(id: number): Promise<UserCoupon | null>;

  /**
   * 사용자 ID로 쿠폰 목록 조회
   */
  findByUserId(
    userId: number,
    status?: UserCouponStatus,
  ): Promise<UserCoupon[]>;

  /**
   * 사용자와 쿠폰 ID로 조회 (중복 발급 확인용)
   */
  findByUserAndCoupon(
    userId: number,
    couponId: number,
  ): Promise<UserCoupon | null>;

  /**
   * 여러 ID로 사용자 쿠폰 조회
   */
  findByIds(ids: number[]): Promise<UserCoupon[]>;

  /**
   * 사용자 쿠폰 목록 조회 (필터)
   */
  findAll(filter: UserCouponListFilter): Promise<UserCoupon[]>;

  /**
   * 사용자 쿠폰 생성
   */
  save(userCoupon: Omit<UserCoupon, 'id'>): Promise<UserCoupon>;

  /**
   * 사용자 쿠폰 수정
   */
  update(id: number, updates: Partial<UserCoupon>): Promise<UserCoupon>;

  /**
   * 사용자의 쿠폰 보유 여부 확인
   */
  existsByUserAndCoupon(userId: number, couponId: number): Promise<boolean>;

  /**
   * 쿠폰별 사용 통계 조회
   */
  getStatisticsByCoupon(couponId: number): Promise<{
    issuedCount: number;
    usedCount: number;
    expiredCount: number;
    unusedCount: number;
  }>;

  /**
   * 만료된 쿠폰 일괄 상태 변경
   * @returns 변경된 쿠폰 수
   */
  expireOldCoupons(currentDate: Date): Promise<number>;

  /**
   * 쿠폰별 발급받은 사용자 ID 목록 조회
   * (Redis 동기화용)
   */
  getUserIdsByCoupon(couponId: number): Promise<number[]>;
}
