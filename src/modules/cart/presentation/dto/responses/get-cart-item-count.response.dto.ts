import { ApiProperty } from '@nestjs/swagger';

/**
 * 장바구니 아이템 수 조회 응답 DTO
 */
export class GetCartItemCountResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '전체 아이템 수', example: 5 })
  totalItems: number;

  @ApiProperty({ description: '구매 가능한 아이템 수', example: 4 })
  availableItems: number;

  @ApiProperty({ description: '구매 불가능한 아이템 수', example: 1 })
  unavailableItems: number;
}
