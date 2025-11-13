import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * 재고 확인 요청 DTO
 */
export class CheckStockRequest {
  @ApiProperty({ description: '확인할 수량', example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;
}
