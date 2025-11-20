import { Injectable } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import { CouponMapper } from '../mappers/coupon.mapper';
import { CouponDto } from '../dtos';

/**
 * FR-CP-003: 쿠폰 상세 조회 Use Case
 *
 * 비즈니스 흐름:
 * 1. 쿠폰 ID로 쿠폰 조회
 * 2. DTO로 변환하여 반환
 */
@Injectable()
export class GetCouponDetailUseCase {
  constructor(
    private readonly couponDomainService: CouponDomainService,
    private readonly couponMapper: CouponMapper,
  ) {}

  async execute(couponId: number): Promise<CouponDto> {
    // 1. 쿠폰 조회
    const coupon = await this.couponDomainService.findCouponById(couponId);

    // 2. DTO로 변환
    return this.couponMapper.toCouponDto(coupon);
  }
}
