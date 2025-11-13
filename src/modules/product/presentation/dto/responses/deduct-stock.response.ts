import { ApiProperty } from '@nestjs/swagger';

/**
 * 재고 차감 응답 DTO
 */
export class DeductStockResponse {
  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '차감 전 재고', example: 100 })
  previousStock: number;

  @ApiProperty({ description: '차감 수량', example: 5 })
  deductedQuantity: number;

  @ApiProperty({ description: '차감 후 재고', example: 95 })
  currentStock: number;
}
