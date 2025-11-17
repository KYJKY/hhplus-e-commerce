import { ApiProperty } from '@nestjs/swagger';

/**
 * 결제 통계 조회 응답 DTO
 */
export class GetPaymentStatisticsResponse {
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
