import { Injectable } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import { CouponMapper } from '../mappers/coupon.mapper';
import { UserCouponWithDetailDto } from '../dtos';
import { CouponIssuanceApplicationService } from '../services/coupon-issuance-app.service';

/**
 * FR-CP-005: 쿠폰 코드로 발급 Use Case
 *
 * 비즈니스 흐름:
 * 1. 쿠폰 코드로 쿠폰 조회
 * 2. Application Service를 통해 쿠폰 발급
 * 3. DTO로 변환하여 반환
 */
@Injectable()
export class IssueCouponByCodeUseCase {
  constructor(
    private readonly couponIssuanceService: CouponIssuanceApplicationService,
    private readonly couponDomainService: CouponDomainService,
    private readonly couponMapper: CouponMapper,
  ) {}

  async execute(
    userId: number,
    couponCode: string,
  ): Promise<UserCouponWithDetailDto> {
    // 1. 쿠폰 코드로 쿠폰 조회
    const coupon = await this.couponDomainService.findCouponByCode(couponCode);

    // 2. 발급 실행 (Application Service에 위임)
    const userCoupon = await this.couponIssuanceService.issueCoupon(
      userId,
      coupon.id,
    );

    // 3. DTO 변환
    return this.couponMapper.toUserCouponWithDetailDto(userCoupon, coupon);
  }
}
