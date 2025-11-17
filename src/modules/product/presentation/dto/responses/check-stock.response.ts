import { ApiProperty } from '@nestjs/swagger';

/**
 * 재고 확인 응답 DTO
 */
export class CheckStockResponse {
  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '상품 ID', example: 1 })
  productId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({ description: '옵션명', example: '화이트 / S' })
  optionName: string;

  @ApiProperty({ description: '현재 재고 수량', example: 100 })
  currentStock: number;

  @ApiProperty({ description: '요청 수량', example: 5 })
  requestedQuantity: number;

  @ApiProperty({ description: '재고 충분 여부', example: true })
  isAvailable: boolean;
}
