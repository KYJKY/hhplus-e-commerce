import { ApiProperty } from '@nestjs/swagger';

/**
 * 장바구니 재고 확인 아이템 DTO
 */
export class CartStockItemDto {
  @ApiProperty({ description: '장바구니 아이템 ID', example: 1 })
  cartItemId: number;

  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({ description: '옵션명', example: '화이트 / S' })
  optionName: string;

  @ApiProperty({ description: '요청 수량', example: 5 })
  requestedQuantity: number;

  @ApiProperty({ description: '재고 수량', example: 3 })
  stockQuantity: number;

  @ApiProperty({ description: '구매 가능 여부', example: false })
  isAvailable: boolean;

  @ApiProperty({
    description: '불가능 사유',
    example: '재고 부족',
    nullable: true,
  })
  reason: string | null;
}
