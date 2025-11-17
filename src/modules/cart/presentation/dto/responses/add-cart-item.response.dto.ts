import { ApiProperty } from '@nestjs/swagger';

/**
 * 장바구니 아이템 추가 응답 DTO
 */
export class AddCartItemResponseDto {
  @ApiProperty({ description: '장바구니 아이템 ID', example: 1 })
  cartItemId: number;

  @ApiProperty({ description: '상품 ID', example: 1 })
  productId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '옵션명', example: '화이트 / S' })
  optionName: string;

  @ApiProperty({ description: '가격', example: 29000 })
  price: number;

  @ApiProperty({ description: '수량', example: 2 })
  quantity: number;

  @ApiProperty({
    description: '추가일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  addedAt: string;
}
