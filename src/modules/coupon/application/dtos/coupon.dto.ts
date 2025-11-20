/**
 * Coupon DTO
 *
 * 쿠폰 정보 전달용 DTO
 */
export class CouponDto {
  constructor(
    public readonly id: number,
    public readonly couponName: string,
    public readonly couponCode: string,
    public readonly couponDescription: string | null,
    public readonly discountRate: number,
    public readonly maxDiscountAmount: number,
    public readonly minOrderAmount: number,
    public readonly issueLimit: number,
    public readonly issuedCount: number,
    public readonly remainingCount: number,
    public readonly validFrom: string,
    public readonly validUntil: string,
    public readonly isActive: boolean,
    public readonly createdAt: string,
  ) {}
}

/**
 * 발급 가능 쿠폰 DTO (사용자별 발급 가능 여부 포함)
 */
export class AvailableCouponDto extends CouponDto {
  constructor(
    coupon: CouponDto,
    public readonly isIssuable: boolean,
    public readonly issuableReason?: string,
  ) {
    super(
      coupon.id,
      coupon.couponName,
      coupon.couponCode,
      coupon.couponDescription,
      coupon.discountRate,
      coupon.maxDiscountAmount,
      coupon.minOrderAmount,
      coupon.issueLimit,
      coupon.issuedCount,
      coupon.remainingCount,
      coupon.validFrom,
      coupon.validUntil,
      coupon.isActive,
      coupon.createdAt,
    );
  }
}
