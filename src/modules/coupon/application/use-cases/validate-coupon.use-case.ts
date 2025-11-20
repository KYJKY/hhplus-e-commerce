import { Injectable } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import { CouponMapper } from '../mappers/coupon.mapper';
import { CouponValidationResultDto } from '../dtos';

/**
 * FR-CP-006: 쿠폰 유효성 검증 Use Case (내부 API)
 *
 * 비즈니스 흐름:
 * 1. 쿠폰 유효성 검증 (Domain Service)
 * 2. 검증 결과 DTO로 변환
 *
 * 검증 항목:
 * - 소유자 확인
 * - 쿠폰 상태 (UNUSED만 사용 가능)
 * - 유효 기간 확인
 * - 최소 주문 금액 확인
 * - 할인 금액 계산
 */
@Injectable()
export class ValidateCouponUseCase {
  constructor(
    private readonly couponDomainService: CouponDomainService,
    private readonly couponMapper: CouponMapper,
  ) {}

  async execute(
    userId: number,
    userCouponId: number,
    orderAmount: number,
  ): Promise<CouponValidationResultDto> {
    // 1. 쿠폰 유효성 검증
    const validationResult = await this.couponDomainService.validateCoupon(
      userId,
      userCouponId,
      orderAmount,
    );

    // 2. 사용자 쿠폰 및 원본 쿠폰 정보 조회
    const userCoupon =
      await this.couponDomainService.findUserCouponById(userCouponId);
    const coupon = await this.couponDomainService.findCouponById(
      userCoupon.couponId,
    );

    // 3. DTO로 변환
    return this.couponMapper.toCouponValidationResultDto(
      userCouponId,
      coupon.id,
      coupon.couponName,
      coupon.discountRate,
      coupon.maxDiscountAmount,
      validationResult,
    );
  }
}
