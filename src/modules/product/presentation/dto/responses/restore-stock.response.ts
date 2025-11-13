import { ApiProperty } from '@nestjs/swagger';

/**
 * 재고 복원 응답 DTO
 */
export class RestoreStockResponse {
  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '복원 전 재고', example: 95 })
  previousStock: number;

  @ApiProperty({ description: '복원 수량', example: 5 })
  restoredQuantity: number;

  @ApiProperty({ description: '복원 후 재고', example: 100 })
  currentStock: number;
}
