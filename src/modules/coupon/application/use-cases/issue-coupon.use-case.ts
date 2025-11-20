import { Injectable, Inject } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import { CouponMapper } from '../mappers/coupon.mapper';
import { UserCouponWithDetailDto } from '../dtos';
import type { ICouponRepository } from '../../domain/repositories';

/**
 * FR-CP-004: 쿠폰 발급 Use Case
 *
 * 비즈니스 흐름:
 * 1. 쿠폰 발급 (Domain Service에서 모든 검증 수행)
 * 2. 원본 쿠폰 정보 조회
 * 3. 상세 정보 포함하여 DTO로 변환
 *
 * 검증 항목 (CouponDomainService에서 처리):
 * - 쿠폰 활성화 여부
 * - 유효 기간 확인
 * - 중복 발급 확인
 * - 발급 가능 수량 확인
 */
@Injectable()
export class IssueCouponUseCase {
  constructor(
    private readonly couponDomainService: CouponDomainService,
    @Inject('ICouponRepository')
    private readonly couponRepository: ICouponRepository,
    private readonly couponMapper: CouponMapper,
  ) {}

  async execute(
    userId: number,
    couponId: number,
  ): Promise<UserCouponWithDetailDto> {
    // 1. 쿠폰 발급
    const userCoupon = await this.couponDomainService.issueCoupon(
      userId,
      couponId,
    );

    // 2. 원본 쿠폰 정보 조회
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new Error('Coupon not found after issuance');
    }

    // 3. DTO로 변환
    return this.couponMapper.toUserCouponWithDetailDto(userCoupon, coupon);
  }
}
