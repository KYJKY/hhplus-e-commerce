import { ApiProperty } from '@nestjs/swagger';
import { CartStockItemDto } from './cart-stock-item.response.dto';

/**
 * 장바구니 재고 확인 응답 DTO
 */
export class CheckCartStockResponseDto {
  @ApiProperty({
    description: '재고 상태별 아이템 목록',
    type: [CartStockItemDto],
  })
  items: CartStockItemDto[];

  @ApiProperty({
    description: '구매 가능한 아이템 수',
    example: 4,
  })
  availableCount: number;

  @ApiProperty({
    description: '구매 불가능한 아이템 수',
    example: 1,
  })
  unavailableCount: number;
}
