/**
 * 사용자 쿠폰 상태
 */
export enum UserCouponStatus {
  UNUSED = 'UNUSED', // 미사용
  USED = 'USED', // 사용 완료
  EXPIRED = 'EXPIRED', // 만료
}

/**
 * UserCoupon 생성 속성
 */
export interface CreateUserCouponProps {
  id: number;
  userId: number;
  couponId: number;
  status?: UserCouponStatus;
  issuedAt: string;
  usedAt?: string | null;
  usedOrderId?: number | null;
}

/**
 * UserCoupon 도메인 엔티티
 *
 * 비즈니스 규칙:
 * - 사용자별 쿠폰 발급 기록 관리
 * - 상태: UNUSED → USED (단방향)
 * - 상태: UNUSED → EXPIRED (자동)
 * - 상태: USED → UNUSED (복원, 1차 범위 제외)
 * - 한 번 사용된 쿠폰은 재사용 불가 (복원 제외)
 */
export class UserCoupon {
  private constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly couponId: number,
    private _status: UserCouponStatus,
    public readonly issuedAt: string,
    private _usedAt: string | null,
    private _usedOrderId: number | null,
  ) {}

  /**
   * 상태 반환
   */
  get status(): UserCouponStatus {
    return this._status;
  }

  /**
   * 사용 시각 반환
   */
  get usedAt(): string | null {
    return this._usedAt;
  }

  /**
   * 사용된 주문 ID 반환
   */
  get usedOrderId(): number | null {
    return this._usedOrderId;
  }

  /**
   * UserCoupon 엔티티 생성 팩토리 메서드
   */
  static create(props: CreateUserCouponProps): UserCoupon {
    return new UserCoupon(
      props.id,
      props.userId,
      props.couponId,
      props.status ?? UserCouponStatus.UNUSED,
      props.issuedAt,
      props.usedAt ?? null,
      props.usedOrderId ?? null,
    );
  }

  /**
   * 쿠폰 사용 처리
   * @param orderId - 주문 ID
   */
  use(orderId: number): void {
    if (this._status !== UserCouponStatus.UNUSED) {
      throw new Error('Coupon is not in UNUSED status');
    }

    this._status = UserCouponStatus.USED;
    this._usedAt = new Date().toISOString();
    this._usedOrderId = orderId;
  }

  /**
   * 쿠폰 만료 처리
   */
  expire(): void {
    if (this._status === UserCouponStatus.USED) {
      throw new Error('Cannot expire a used coupon');
    }

    this._status = UserCouponStatus.EXPIRED;
  }

  /**
   * 쿠폰 복원 (주문 취소 시)
   * 1차 범위 제외이지만 인터페이스 제공
   */
  restore(): void {
    if (this._status !== UserCouponStatus.USED) {
      throw new Error('Only used coupons can be restored');
    }

    this._status = UserCouponStatus.UNUSED;
    this._usedAt = null;
    this._usedOrderId = null;
  }

  /**
   * 미사용 상태 여부 확인
   */
  isUnused(): boolean {
    return this._status === UserCouponStatus.UNUSED;
  }

  /**
   * 사용된 상태 여부 확인
   */
  isUsed(): boolean {
    return this._status === UserCouponStatus.USED;
  }

  /**
   * 만료된 상태 여부 확인
   */
  isExpired(): boolean {
    return this._status === UserCouponStatus.EXPIRED;
  }

  /**
   * 소유자 확인
   * @param userId - 사용자 ID
   */
  isOwnedBy(userId: number): boolean {
    return this.userId === userId;
  }

  /**
   * 사용 가능 여부 확인
   */
  canUse(): boolean {
    return this._status === UserCouponStatus.UNUSED;
  }
}
