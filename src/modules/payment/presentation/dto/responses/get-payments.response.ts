import { ApiProperty } from '@nestjs/swagger';

/**
 * 결제 내역 DTO
 */
export class Payment {
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
export class GetPaymentsResponse {
  @ApiProperty({ description: '결제 내역 목록', type: [Payment] })
  payments: Payment[];

  @ApiProperty({ description: '전체 결제 수', example: 50 })
  totalCount: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '전체 페이지 수', example: 3 })
  totalPages: number;
}
