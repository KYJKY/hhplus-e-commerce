import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../domain/enums/order-status.enum';

/**
 * 주문 생성 요청 DTO
 */
export class CreateOrderRequestDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: '장바구니 항목 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  cartItemIds: number[];

  @ApiProperty({ description: '배송지 ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  addressId: number;

  @ApiProperty({
    description: '적용할 사용자 쿠폰 ID (선택)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  userCouponId?: number;
}

/**
 * 주문 결제 처리 요청 DTO
 */
export class ProcessPaymentRequestDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '주문 ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}

/**
 * 주문 상태 변경 요청 DTO
 */
export class ChangeOrderStatusRequestDto {
  @ApiProperty({
    description: '변경할 상태',
    enum: OrderStatus,
    example: OrderStatus.PAID,
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiProperty({
    description: '상태 변경 사유 (선택)',
    example: '결제 완료',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * 주문 목록 조회 Query DTO
 */
export class GetOrderListQueryDto {
  @ApiProperty({
    description: '주문 상태 필터 (선택)',
    enum: OrderStatus,
    required: false,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({
    description: '페이지 번호',
    example: 1,
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: '페이지 크기',
    example: 20,
    default: 20,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  size?: number = 20;
}
