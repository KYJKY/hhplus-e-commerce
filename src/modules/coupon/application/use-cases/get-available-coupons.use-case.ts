import { Injectable } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import { CouponMapper } from '../mappers/coupon.mapper';
import { AvailableCouponDto } from '../dtos';

/**
 * FR-CP-001: 발급 가능 쿠폰 목록 조회 Use Case
 *
 * 비즈니스 흐름:
 * 1. 발급 가능한 쿠폰 목록 조회 (활성화 + 유효 기간 내 + 발급 가능)
 * 2. 사용자 ID가 제공된 경우, 각 쿠폰별 사용자 발급 가능 여부 확인
 * 3. DTO로 변환하여 반환
 */
@Injectable()
export class GetAvailableCouponsUseCase {
  constructor(
    private readonly couponDomainService: CouponDomainService,
    private readonly couponMapper: CouponMapper,
  ) {}

  async execute(userId?: number): Promise<AvailableCouponDto[]> {
    // 1. 발급 가능한 쿠폰 목록 조회
    const coupons = await this.couponDomainService.findAvailableCoupons();

    // 2. 사용자별 발급 가능 여부 확인 (userId가 제공된 경우)
    if (userId) {
      const userCoupons =
        await this.couponDomainService.findUserCouponsByUserId(userId);
      const issuedCouponIds = new Set(
        userCoupons.map((uc) => uc.couponId),
      );

      return coupons.map((coupon) => {
        const isIssuable = !issuedCouponIds.has(coupon.id);
        const reason = isIssuable
          ? undefined
          : 'Already issued to this user';
        return this.couponMapper.toAvailableCouponDto(
          coupon,
          isIssuable,
          reason,
        );
      });
    }

    // 3. userId가 없는 경우 모든 쿠폰 발급 가능으로 표시
    return coupons.map((coupon) =>
      this.couponMapper.toAvailableCouponDto(coupon, true),
    );
  }
}
