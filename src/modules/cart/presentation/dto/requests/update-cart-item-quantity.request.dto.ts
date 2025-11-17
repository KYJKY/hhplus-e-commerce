import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

/**
 * 장바구니 아이템 수량 수정 요청 DTO
 */
export class UpdateCartItemQuantityRequestDto {
  @ApiProperty({
    description: '변경할 수량 (1-99)',
    example: 3,
    minimum: 1,
    maximum: 99,
  })
  @IsNumber()
  @Min(1)
  @Max(99)
  quantity: number;
}
