import { Injectable } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import { CouponMapper } from '../mappers/coupon.mapper';
import { UserCouponWithDetailDto } from '../dtos';
import { CouponIssuanceApplicationService } from '../services/coupon-issuance-app.service';

/**
 * FR-CP-004: 쿠폰 발급 Use Case (couponId 기반)
 *
 * 비즈니스 흐름:
 * 1. Application Service를 통해 쿠폰 발급
 * 2. 쿠폰 상세 정보 조회
 * 3. DTO로 변환하여 반환
 */
@Injectable()
export class IssueCouponUseCase {
  constructor(
    private readonly couponIssuanceService: CouponIssuanceApplicationService,
    private readonly couponDomainService: CouponDomainService,
    private readonly couponMapper: CouponMapper,
  ) {}

  async execute(
    userId: number,
    couponId: number,
  ): Promise<UserCouponWithDetailDto> {
    // 1. 발급 실행 (Application Service에 위임)
    const userCoupon = await this.couponIssuanceService.issueCoupon(
      userId,
      couponId,
    );

    // 2. 쿠폰 조회 (DTO 변환용)
    const coupon = await this.couponDomainService.findCouponById(couponId);

    // 3. DTO 변환
    return this.couponMapper.toUserCouponWithDetailDto(userCoupon, coupon);
  }
}
