import { ApiProperty } from '@nestjs/swagger';

/**
 * 여러 장바구니 아이템 삭제 응답 DTO
 */
export class RemoveMultipleCartItemsResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({
    description: '삭제된 아이템 수',
    example: 3,
  })
  deletedCount: number;

  @ApiProperty({
    description: '삭제된 장바구니 아이템 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  deletedCartItemIds: number[];
}
