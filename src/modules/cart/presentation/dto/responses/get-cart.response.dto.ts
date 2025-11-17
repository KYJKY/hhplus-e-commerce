import { ApiProperty } from '@nestjs/swagger';
import { CartItemDto } from './cart-item.response.dto';

/**
 * 장바구니 조회 응답 DTO
 */
export class GetCartResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '장바구니 아이템 목록', type: [CartItemDto] })
  items: CartItemDto[];

  @ApiProperty({ description: '총 아이템 수', example: 3 })
  totalItems: number;

  @ApiProperty({ description: '총 금액', example: 145000 })
  totalAmount: number;
}
