import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

/**
 * 쿠폰 발급 요청 DTO
 */
export class IssueCouponRequestDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '쿠폰 ID',
    example: 1,
  })
  @IsNumber()
  couponId: number;
}

/**
 * 쿠폰 코드로 발급 요청 DTO
 */
export class IssueCouponByCodeRequestDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '쿠폰 코드',
    example: 'WELCOME2024',
  })
  @IsString()
  couponCode: string;
}

/**
 * 쿠폰 유효성 검증 요청 DTO
 */
export class ValidateCouponRequestDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '사용자 쿠폰 ID',
    example: 1,
  })
  @IsNumber()
  userCouponId: number;

  @ApiProperty({
    description: '주문 금액',
    example: 50000,
  })
  @IsNumber()
  orderAmount: number;
}

/**
 * 쿠폰 사용 요청 DTO
 */
export class UseCouponRequestDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '사용자 쿠폰 ID',
    example: 1,
  })
  @IsNumber()
  userCouponId: number;

  @ApiProperty({
    description: '주문 ID',
    example: 1,
  })
  @IsNumber()
  orderId: number;
}
