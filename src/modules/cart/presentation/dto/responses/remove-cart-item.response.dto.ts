import { ApiProperty } from '@nestjs/swagger';

/**
 * 장바구니 아이템 삭제 응답 DTO
 */
export class RemoveCartItemResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '삭제된 장바구니 아이템 ID', example: 1 })
  deletedCartItemId: number;
}
