import { Injectable, Inject } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import { CouponMapper } from '../mappers/coupon.mapper';
import { UserCouponDto } from '../dtos';

/**
 * FR-CP-007: 쿠폰 사용 처리 Use Case (내부 API)
 *
 * 비즈니스 흐름:
 * 1. 쿠폰 사용 처리 (Domain Service)
 * 2. DTO로 변환하여 반환
 *
 * 주의:
 * - 결제 완료 후 호출되어야 함
 * - UNUSED 상태의 쿠폰만 사용 가능
 */
@Injectable()
export class UseCouponUseCase {
  constructor(
    private readonly couponDomainService: CouponDomainService,
    private readonly couponMapper: CouponMapper,
  ) {}

  async execute(
    userId: number,
    userCouponId: number,
    orderId: number,
  ): Promise<UserCouponDto> {
    // 1. 쿠폰 사용 처리
    const userCoupon = await this.couponDomainService.useCoupon(
      userId,
      userCouponId,
      orderId,
    );

    // 2. DTO로 변환
    return this.couponMapper.toUserCouponDto(userCoupon);
  }
}
