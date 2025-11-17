import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 여러 장바구니 아이템 삭제 요청 DTO
 */
export class RemoveMultipleCartItemsRequestDto {
  @ApiProperty({
    description: '삭제할 장바구니 아이템 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  cartItemIds: number[];
}
