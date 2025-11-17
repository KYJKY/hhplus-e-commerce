import { ApiProperty } from '@nestjs/swagger';

/**
 * 상품 옵션 상세 조회 응답 DTO
 */
export class GetProductOptionDetailResponse {
  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '상품 ID', example: 1 })
  productId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({ description: '옵션명', example: '화이트 / S' })
  optionName: string;

  @ApiProperty({
    description: '옵션 설명',
    example: '화이트 색상 S 사이즈',
    nullable: true,
  })
  optionDescription: string | null;

  @ApiProperty({ description: '가격', example: 29000 })
  price: number;

  @ApiProperty({ description: '재고 수량', example: 100 })
  stockQuantity: number;

  @ApiProperty({ description: '판매 가능 여부', example: true })
  isAvailable: boolean;
}
