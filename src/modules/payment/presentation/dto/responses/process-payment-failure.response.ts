import { ApiProperty } from '@nestjs/swagger';

/**
 * 결제 실패 처리 응답 DTO
 */
export class ProcessPaymentFailureResponse {
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
