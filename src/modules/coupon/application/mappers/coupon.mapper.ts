import { Injectable } from '@nestjs/common';
import { Coupon } from '../../domain/entities/coupon.entity';
import { UserCoupon } from '../../domain/entities/user-coupon.entity';
import {
  CouponDto,
  AvailableCouponDto,
  UserCouponDto,
  UserCouponWithDetailDto,
  CouponValidationResultDto,
  CouponStatisticsDto,
} from '../dtos';

/**
 * Coupon Mapper
 *
 * Domain Entity ↔ Application DTO 변환
 * Presentation Layer와 Domain Layer를 격리
 */
@Injectable()
export class CouponMapper {
  /**
   * Coupon Entity → CouponDto
   */
  toCouponDto(coupon: Coupon): CouponDto {
    return new CouponDto(
      coupon.id,
      coupon.couponName,
      coupon.couponCode,
      coupon.couponDescription,
      coupon.discountRate,
      coupon.maxDiscountAmount,
      coupon.minOrderAmount,
      coupon.issueLimit,
      coupon.issuedCount,
      coupon.getRemainingCount(),
      coupon.validFrom,
      coupon.validUntil,
      coupon.isActive,
      coupon.createdAt,
    );
  }

  /**
   * Coupon Entity → AvailableCouponDto (발급 가능 여부 포함)
   */
  toAvailableCouponDto(
    coupon: Coupon,
    isIssuable: boolean,
    reason?: string,
  ): AvailableCouponDto {
    const couponDto = this.toCouponDto(coupon);
    return new AvailableCouponDto(couponDto, isIssuable, reason);
  }

  /**
   * UserCoupon Entity → UserCouponDto
   */
  toUserCouponDto(userCoupon: UserCoupon): UserCouponDto {
    return new UserCouponDto(
      userCoupon.id,
      userCoupon.userId,
      userCoupon.couponId,
      userCoupon.status,
      userCoupon.issuedAt,
      userCoupon.usedAt,
      userCoupon.usedOrderId,
    );
  }

  /**
   * UserCoupon Entity + Coupon Entity → UserCouponWithDetailDto
   */
  toUserCouponWithDetailDto(
    userCoupon: UserCoupon,
    coupon: Coupon,
  ): UserCouponWithDetailDto {
    const userCouponDto = this.toUserCouponDto(userCoupon);
    return new UserCouponWithDetailDto(
      userCouponDto,
      coupon.couponName,
      coupon.couponCode,
      coupon.discountRate,
      coupon.maxDiscountAmount,
      coupon.minOrderAmount,
      coupon.validFrom,
      coupon.validUntil,
    );
  }

  /**
   * 쿠폰 유효성 검증 결과 → CouponValidationResultDto
   */
  toCouponValidationResultDto(
    userCouponId: number,
    couponId: number,
    couponName: string,
    discountRate: number,
    maxDiscountAmount: number,
    validationResult: {
      isValid: boolean;
      discountAmount: number;
      errors: string[];
    },
  ): CouponValidationResultDto {
    return new CouponValidationResultDto(
      userCouponId,
      couponId,
      couponName,
      validationResult.isValid,
      discountRate,
      validationResult.discountAmount,
      maxDiscountAmount,
      validationResult.errors,
    );
  }

  /**
   * 쿠폰 통계 → CouponStatisticsDto
   */
  toCouponStatisticsDto(
    coupon: Coupon,
    statistics: {
      issuedCount: number;
      usedCount: number;
      expiredCount: number;
      unusedCount: number;
      usageRate: number;
    },
  ): CouponStatisticsDto {
    return new CouponStatisticsDto(
      coupon.id,
      coupon.couponName,
      coupon.issueLimit,
      statistics.issuedCount,
      statistics.usedCount,
      statistics.expiredCount,
      statistics.unusedCount,
      statistics.usageRate,
    );
  }
}
