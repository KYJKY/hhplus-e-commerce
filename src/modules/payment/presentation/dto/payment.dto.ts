import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 포인트 잔액 조회 응답 DTO
 */
export class GetBalanceResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '현재 포인트 잔액', example: 100000 })
  balance: number;

  @ApiProperty({
    description: '마지막 업데이트 일시',
    example: '2024-11-05T12:00:00.000Z',
    nullable: true,
  })
  lastUpdatedAt: string | null;
}

/**
 * 포인트 충전 요청 DTO
 */
export class ChargePointRequestDto {
  @ApiProperty({
    description: '충전할 포인트 금액 (1,000 ~ 1,000,000원, 1,000원 단위)',
    example: 50000,
  })
  @IsNumber()
  @Min(1000)
  amount: number;
}

/**
 * 포인트 충전 응답 DTO
 */
export class ChargePointResponseDto {
  @ApiProperty({ description: '포인트 거래 ID', example: 1 })
  pointTransactionId: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '충전 금액', example: 50000 })
  amount: number;

  @ApiProperty({ description: '충전 전 잔액', example: 100000 })
  previousBalance: number;

  @ApiProperty({ description: '충전 후 잔액', example: 150000 })
  currentBalance: number;

  @ApiProperty({ description: '거래 유형', example: 'CHARGE' })
  transactionType: 'CHARGE';

  @ApiProperty({
    description: '충전 일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  createdAt: string;
}

/**
 * 포인트 사용 내역 조회 요청 DTO
 */
export class GetPointTransactionsRequestDto {
  @ApiProperty({
    description: '거래 유형 필터',
    enum: ['CHARGE', 'USE', 'REFUND'],
    required: false,
    example: 'CHARGE',
  })
  @IsOptional()
  @IsEnum(['CHARGE', 'USE', 'REFUND'])
  transactionType?: 'CHARGE' | 'USE' | 'REFUND';

  @ApiProperty({
    description: '조회 시작 일자',
    required: false,
    example: '2024-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '조회 종료 일자',
    required: false,
    example: '2024-11-05T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '페이지 번호',
    required: false,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: '페이지 크기',
    required: false,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  size?: number;
}

/**
 * 포인트 거래 내역 DTO
 */
export class PointTransactionDto {
  @ApiProperty({ description: '거래 ID', example: 1 })
  pointTransactionId: number;

  @ApiProperty({
    description: '거래 유형',
    enum: ['CHARGE', 'USE', 'REFUND'],
    example: 'CHARGE',
  })
  transactionType: 'CHARGE' | 'USE' | 'REFUND';

  @ApiProperty({ description: '금액', example: 50000 })
  amount: number;

  @ApiProperty({ description: '거래 후 잔액', example: 150000 })
  balance: number;

  @ApiProperty({
    description: '관련 주문 ID',
    example: 1,
    nullable: true,
  })
  relatedOrderId: number | null;

  @ApiProperty({
    description: '거래 설명',
    example: '포인트 충전',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: '거래 일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  createdAt: string;
}

/**
 * 포인트 사용 내역 조회 응답 DTO
 */
export class GetPointTransactionsResponseDto {
  @ApiProperty({
    description: '포인트 거래 내역 목록',
    type: [PointTransactionDto],
  })
  transactions: PointTransactionDto[];

  @ApiProperty({ description: '전체 거래 수', example: 100 })
  totalCount: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}

/**
 * 결제 처리 요청 DTO (내부 API)
 */
export class ProcessPaymentRequestDto {
  @ApiProperty({ description: '주문 ID', example: 1 })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: '결제 금액', example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number;
}

/**
 * 결제 처리 응답 DTO
 */
export class ProcessPaymentResponseDto {
  @ApiProperty({ description: '결제 ID', example: 1 })
  paymentId: number;

  @ApiProperty({ description: '주문 ID', example: 1 })
  orderId: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '결제 금액', example: 50000 })
  amount: number;

  @ApiProperty({ description: '결제 수단', example: 'POINT' })
  paymentMethod: string;

  @ApiProperty({ description: '결제 전 잔액', example: 100000 })
  previousBalance: number;

  @ApiProperty({ description: '결제 후 잔액', example: 50000 })
  currentBalance: number;

  @ApiProperty({ description: '결제 상태', example: 'SUCCESS' })
  status: 'SUCCESS';

  @ApiProperty({
    description: '결제 완료 일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  paidAt: string;
}

/**
 * 결제 내역 조회 요청 DTO
 */
export class GetPaymentsRequestDto {
  @ApiProperty({
    description: '결제 상태 필터',
    enum: ['SUCCESS', 'FAILED', 'CANCELLED'],
    required: false,
    example: 'SUCCESS',
  })
  @IsOptional()
  @IsEnum(['SUCCESS', 'FAILED', 'CANCELLED'])
  status?: 'SUCCESS' | 'FAILED' | 'CANCELLED';

  @ApiProperty({
    description: '페이지 번호',
    required: false,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: '페이지 크기',
    required: false,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  size?: number;
}

/**
 * 결제 내역 DTO
 */
export class PaymentDto {
  @ApiProperty({ description: '결제 ID', example: 1 })
  paymentId: number;

  @ApiProperty({ description: '주문 ID', example: 1 })
  orderId: number;

  @ApiProperty({ description: '주문번호', example: 'ORD-1' })
  orderNumber: string;

  @ApiProperty({ description: '결제 금액', example: 50000 })
  amount: number;

  @ApiProperty({ description: '결제 수단', example: 'POINT' })
  paymentMethod: string;

  @ApiProperty({
    description: '결제 상태',
    enum: ['SUCCESS', 'FAILED', 'CANCELLED'],
    example: 'SUCCESS',
  })
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';

  @ApiProperty({
    description: '결제 일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  paidAt: string;
}

/**
 * 결제 내역 조회 응답 DTO
 */
export class GetPaymentsResponseDto {
  @ApiProperty({ description: '결제 내역 목록', type: [PaymentDto] })
  payments: PaymentDto[];

  @ApiProperty({ description: '전체 결제 수', example: 50 })
  totalCount: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '전체 페이지 수', example: 3 })
  totalPages: number;
}

/**
 * 결제 상세 조회 응답 DTO
 */
export class GetPaymentDetailResponseDto {
  @ApiProperty({ description: '결제 ID', example: 1 })
  paymentId: number;

  @ApiProperty({ description: '주문 ID', example: 1 })
  orderId: number;

  @ApiProperty({ description: '주문번호', example: 'ORD-1' })
  orderNumber: string;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '결제 금액', example: 50000 })
  amount: number;

  @ApiProperty({ description: '결제 수단', example: 'POINT' })
  paymentMethod: string;

  @ApiProperty({
    description: '결제 상태',
    enum: ['SUCCESS', 'FAILED', 'CANCELLED'],
    example: 'SUCCESS',
  })
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';

  @ApiProperty({
    description: '결제 일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  paidAt: string;

  @ApiProperty({
    description: '포인트 거래 ID',
    example: 1,
    nullable: true,
  })
  pointTransactionId: number | null;

  @ApiProperty({
    description: '실패 사유',
    example: null,
    nullable: true,
  })
  failureReason: string | null;
}

/**
 * 결제 실패 처리 요청 DTO (내부 API)
 */
export class ProcessPaymentFailureRequestDto {
  @ApiProperty({ description: '주문 ID', example: 1 })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: '시도한 결제 금액', example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: '실패 사유',
    example: '포인트 잔액 부족',
  })
  @IsString()
  failureReason: string;
}

/**
 * 결제 실패 처리 응답 DTO
 */
export class ProcessPaymentFailureResponseDto {
  @ApiProperty({ description: '결제 ID', example: 1 })
  paymentId: number;

  @ApiProperty({ description: '주문 ID', example: 1 })
  orderId: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '결제 금액', example: 50000 })
  amount: number;

  @ApiProperty({ description: '결제 상태', example: 'FAILED' })
  status: 'FAILED';

  @ApiProperty({
    description: '실패 사유',
    example: '포인트 잔액 부족',
  })
  failureReason: string;

  @ApiProperty({
    description: '실패 일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  failedAt: string;
}

/**
 * 포인트 차감 검증 요청 DTO (내부 API)
 */
export class ValidatePointDeductionRequestDto {
  @ApiProperty({ description: '차감할 금액', example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number;
}

/**
 * 포인트 차감 검증 응답 DTO
 */
export class ValidatePointDeductionResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '현재 잔액', example: 100000 })
  currentBalance: number;

  @ApiProperty({ description: '요청 금액', example: 50000 })
  requestedAmount: number;

  @ApiProperty({ description: '차감 가능 여부', example: true })
  isAvailable: boolean;

  @ApiProperty({ description: '부족 금액', example: 0 })
  shortage: number;
}

/**
 * 결제 통계 조회 응답 DTO
 */
export class GetPaymentStatisticsResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '총 결제 건수', example: 10 })
  totalPayments: number;

  @ApiProperty({ description: '총 결제 금액', example: 500000 })
  totalAmount: number;

  @ApiProperty({ description: '성공한 결제 건수', example: 9 })
  successfulPayments: number;

  @ApiProperty({ description: '실패한 결제 건수', example: 1 })
  failedPayments: number;

  @ApiProperty({ description: '평균 결제 금액', example: 55555.56 })
  averagePaymentAmount: number;

  @ApiProperty({
    description: '마지막 결제 일시',
    example: '2024-11-05T12:00:00.000Z',
    nullable: true,
  })
  lastPaymentAt: string | null;
}
