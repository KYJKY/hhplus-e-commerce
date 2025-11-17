import { ApiProperty } from '@nestjs/swagger';

/**
 * 장바구니 아이템 수량 수정 응답 DTO
 */
export class UpdateCartItemQuantityResponseDto {
  @ApiProperty({ description: '장바구니 아이템 ID', example: 1 })
  cartItemId: number;

  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '이전 수량', example: 2 })
  previousQuantity: number;

  @ApiProperty({ description: '변경된 수량', example: 5 })
  quantity: number;

  @ApiProperty({ description: '가격', example: 29000 })
  price: number;

  @ApiProperty({ description: '새 소계', example: 145000 })
  subtotal: number;

  @ApiProperty({
    description: '수정일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  updatedAt: string;
}
