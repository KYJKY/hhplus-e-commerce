import { ApiProperty } from '@nestjs/swagger';

/**
 * 결제 처리 응답 DTO
 */
export class ProcessPaymentResponse {
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
