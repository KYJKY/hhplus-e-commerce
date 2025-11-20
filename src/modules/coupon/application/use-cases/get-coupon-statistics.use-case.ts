import { Injectable } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import { CouponMapper } from '../mappers/coupon.mapper';
import { CouponStatisticsDto } from '../dtos';

/**
 * FR-CP-010: 쿠폰 통계 조회 Use Case
 *
 * 비즈니스 흐름:
 * 1. 쿠폰 통계 조회 (Domain Service)
 * 2. DTO로 변환하여 반환
 *
 * 통계 항목:
 * - 발급 한도
 * - 발급 수량
 * - 사용 수량
 * - 만료 수량
 * - 미사용 수량
 * - 사용률
 */
@Injectable()
export class GetCouponStatisticsUseCase {
  constructor(
    private readonly couponDomainService: CouponDomainService,
    private readonly couponMapper: CouponMapper,
  ) {}

  async execute(couponId: number): Promise<CouponStatisticsDto> {
    // 1. 쿠폰 통계 조회
    const result = await this.couponDomainService.getCouponStatistics(couponId);

    // 2. DTO로 변환
    return this.couponMapper.toCouponStatisticsDto(
      result.coupon,
      result.statistics,
    );
  }
}
