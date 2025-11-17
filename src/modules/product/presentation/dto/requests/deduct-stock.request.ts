import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * 재고 차감 요청 DTO
 */
export class DeductStockRequest {
  @ApiProperty({ description: '차감할 수량', example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '주문 ID', example: 1 })
  @IsNumber()
  orderId: number;
}
