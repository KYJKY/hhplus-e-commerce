/**
 * 쿠폰 통계 DTO
 */
export class CouponStatisticsDto {
  constructor(
    public readonly couponId: number,
    public readonly couponName: string,
    public readonly issueLimit: number,
    public readonly issuedCount: number,
    public readonly usedCount: number,
    public readonly expiredCount: number,
    public readonly unusedCount: number,
    public readonly usageRate: number, // 사용률 (%)
  ) {}
}
