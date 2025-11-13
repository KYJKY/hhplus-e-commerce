import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * 재고 복원 요청 DTO
 */
export class RestoreStockRequest {
  @ApiProperty({ description: '복원할 수량', example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '주문 ID', example: 1 })
  @IsNumber()
  orderId: number;
}
