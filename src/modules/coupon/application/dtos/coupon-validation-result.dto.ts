/**
 * 쿠폰 유효성 검증 결과 DTO
 */
export class CouponValidationResultDto {
  constructor(
    public readonly userCouponId: number,
    public readonly couponId: number,
    public readonly couponName: string,
    public readonly isValid: boolean,
    public readonly discountRate: number,
    public readonly discountAmount: number,
    public readonly maxDiscountAmount: number,
    public readonly validationErrors: string[],
  ) {}
}
