import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

/**
 * 장바구니 아이템 추가 요청 DTO
 */
export class AddCartItemRequestDto {
  @ApiProperty({
    description: '상품 옵션 ID',
    example: 1,
  })
  @IsNumber()
  productOptionId: number;

  @ApiProperty({
    description: '수량 (1-99)',
    example: 2,
    minimum: 1,
    maximum: 99,
  })
  @IsNumber()
  @Min(1)
  @Max(99)
  quantity: number;
}
