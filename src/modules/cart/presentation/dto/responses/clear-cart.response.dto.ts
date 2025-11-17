import { ApiProperty } from '@nestjs/swagger';

/**
 * 장바구니 비우기 응답 DTO
 */
export class ClearCartResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({
    description: '삭제된 아이템 수',
    example: 5,
  })
  deletedCount: number;
}
