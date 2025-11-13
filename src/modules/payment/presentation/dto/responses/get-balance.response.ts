import { ApiProperty } from '@nestjs/swagger';

/**
 * 포인트 잔액 조회 응답 DTO
 */
export class GetBalanceResponse {
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
