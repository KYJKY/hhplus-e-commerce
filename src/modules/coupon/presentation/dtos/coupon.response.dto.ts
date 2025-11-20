import { ApiProperty } from '@nestjs/swagger';
import { UserCouponStatus } from '../../domain/entities/user-coupon.entity';
import {
  CouponDto,
  AvailableCouponDto,
  UserCouponWithDetailDto,
  CouponValidationResultDto,
  CouponStatisticsDto,
} from '../../application/dtos';

/**
 * 쿠폰 응답 DTO
 */
export class CouponResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() couponName: string;
  @ApiProperty() couponCode: string;
  @ApiProperty({ nullable: true }) couponDescription: string | null;
  @ApiProperty() discountRate: number;
  @ApiProperty() maxDiscountAmount: number;
  @ApiProperty() minOrderAmount: number;
  @ApiProperty() issueLimit: number;
  @ApiProperty() issuedCount: number;
  @ApiProperty() remainingCount: number;
  @ApiProperty() validFrom: string;
  @ApiProperty() validUntil: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: string;

  static from(dto: CouponDto): CouponResponseDto {
    const response = new CouponResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 발급 가능 쿠폰 응답 DTO
 */
export class AvailableCouponResponseDto extends CouponResponseDto {
  @ApiProperty() isIssuable: boolean;
  @ApiProperty({ required: false }) issuableReason?: string;

  static from(dto: AvailableCouponDto): AvailableCouponResponseDto {
    const response = new AvailableCouponResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 사용자 쿠폰 상세 응답 DTO
 */
export class UserCouponDetailResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() userId: number;
  @ApiProperty() couponId: number;
  @ApiProperty() couponName: string;
  @ApiProperty() couponCode: string;
  @ApiProperty() discountRate: number;
  @ApiProperty() maxDiscountAmount: number;
  @ApiProperty() minOrderAmount: number;
  @ApiProperty() validFrom: string;
  @ApiProperty() validUntil: string;
  @ApiProperty({ enum: UserCouponStatus }) status: UserCouponStatus;
  @ApiProperty() issuedAt: string;
  @ApiProperty({ nullable: true }) usedAt: string | null;
  @ApiProperty({ nullable: true }) usedOrderId: number | null;

  static from(dto: UserCouponWithDetailDto): UserCouponDetailResponseDto {
    const response = new UserCouponDetailResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 쿠폰 유효성 검증 결과 응답 DTO
 */
export class CouponValidationResponseDto {
  @ApiProperty() userCouponId: number;
  @ApiProperty() couponId: number;
  @ApiProperty() couponName: string;
  @ApiProperty() isValid: boolean;
  @ApiProperty() discountRate: number;
  @ApiProperty() discountAmount: number;
  @ApiProperty() maxDiscountAmount: number;
  @ApiProperty({ type: [String] }) validationErrors: string[];

  static from(dto: CouponValidationResultDto): CouponValidationResponseDto {
    const response = new CouponValidationResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 쿠폰 통계 응답 DTO
 */
export class CouponStatisticsResponseDto {
  @ApiProperty() couponId: number;
  @ApiProperty() couponName: string;
  @ApiProperty() issueLimit: number;
  @ApiProperty() issuedCount: number;
  @ApiProperty() usedCount: number;
  @ApiProperty() expiredCount: number;
  @ApiProperty() unusedCount: number;
  @ApiProperty() usageRate: number;

  static from(dto: CouponStatisticsDto): CouponStatisticsResponseDto {
    const response = new CouponStatisticsResponseDto();
    Object.assign(response, dto);
    return response;
  }
}
