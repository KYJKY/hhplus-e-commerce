import { ApiProperty } from '@nestjs/swagger';

/**
 * 포인트 충전 응답 DTO
 */
export class ChargePointResponse {
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
