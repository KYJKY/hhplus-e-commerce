import { Injectable, Inject } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import { CouponMapper } from '../mappers/coupon.mapper';
import { UserCouponWithDetailDto } from '../dtos';
import { UserCouponStatus } from '../../domain/entities/user-coupon.entity';
import type { ICouponRepository } from '../../domain/repositories';

/**
 * FR-CP-002: 보유 쿠폰 목록 조회 Use Case
 *
 * 비즈니스 흐름:
 * 1. 사용자의 쿠폰 목록 조회 (상태 필터 적용 가능)
 * 2. 각 사용자 쿠폰의 원본 쿠폰 정보 조회
 * 3. 상세 정보 포함하여 DTO로 변환
 */
@Injectable()
export class GetUserCouponsUseCase {
  constructor(
    private readonly couponDomainService: CouponDomainService,
    @Inject('ICouponRepository')
    private readonly couponRepository: ICouponRepository,
    private readonly couponMapper: CouponMapper,
  ) {}

  async execute(
    userId: number,
    status?: UserCouponStatus,
  ): Promise<UserCouponWithDetailDto[]> {
    // 1. 사용자의 쿠폰 목록 조회
    const userCoupons = await this.couponDomainService.findUserCouponsByUserId(
      userId,
      status,
    );

    // 2. 각 사용자 쿠폰의 원본 쿠폰 정보 조회
    const couponsWithDetails = await Promise.all(
      userCoupons.map(async (userCoupon) => {
        const coupon = await this.couponRepository.findById(
          userCoupon.couponId,
        );
        if (!coupon) {
          // 쿠폰이 삭제된 경우 null 반환
          return null;
        }
        return this.couponMapper.toUserCouponWithDetailDto(userCoupon, coupon);
      }),
    );

    // 3. null 필터링 (삭제된 쿠폰 제외)
    return couponsWithDetails.filter(
      (dto): dto is UserCouponWithDetailDto => dto !== null,
    );
  }
}
