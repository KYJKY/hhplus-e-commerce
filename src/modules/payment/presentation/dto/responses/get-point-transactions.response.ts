import { ApiProperty } from '@nestjs/swagger';

/**
 * 포인트 거래 내역 DTO
 */
export class PointTransaction {
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
export class GetPointTransactionsResponse {
  @ApiProperty({
    description: '포인트 거래 내역 목록',
    type: [PointTransaction],
  })
  transactions: PointTransaction[];

  @ApiProperty({ description: '전체 거래 수', example: 100 })
  totalCount: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}
