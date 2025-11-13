import { ApiProperty } from '@nestjs/swagger';

/**
 * 포인트 차감 검증 응답 DTO
 */
export class ValidatePointDeductionResponse {
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
