import { UserCouponStatus } from '../../domain/entities/user-coupon.entity';

/**
 * UserCoupon DTO
 *
 * 사용자 쿠폰 정보 전달용 DTO
 */
export class UserCouponDto {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly couponId: number,
    public readonly status: UserCouponStatus,
    public readonly issuedAt: string,
    public readonly usedAt: string | null,
    public readonly usedOrderId: number | null,
  ) {}
}

/**
 * 쿠폰 상세 정보를 포함한 사용자 쿠폰 DTO
 */
export class UserCouponWithDetailDto extends UserCouponDto {
  constructor(
    userCoupon: UserCouponDto,
    public readonly couponName: string,
    public readonly couponCode: string,
    public readonly discountRate: number,
    public readonly maxDiscountAmount: number,
    public readonly minOrderAmount: number,
    public readonly validFrom: string,
    public readonly validUntil: string,
  ) {
    super(
      userCoupon.id,
      userCoupon.userId,
      userCoupon.couponId,
      userCoupon.status,
      userCoupon.issuedAt,
      userCoupon.usedAt,
      userCoupon.usedOrderId,
    );
  }
}
