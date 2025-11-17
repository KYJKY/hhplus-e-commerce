import { ApiProperty } from '@nestjs/swagger';

/**
 * 결제 상세 조회 응답 DTO
 */
export class GetPaymentDetailResponse {
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
