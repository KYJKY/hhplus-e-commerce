import { ApiProperty } from '@nestjs/swagger';

/**
 * 카테고리별 상품 수 조회 응답 DTO
 */
export class GetCategoryProductCountResponse {
  @ApiProperty({ description: '카테고리 ID', example: 1 })
  categoryId: number;

  @ApiProperty({ description: '카테고리명', example: '상의' })
  categoryName: string;

  @ApiProperty({ description: '상품 개수', example: 10 })
  productCount: number;
}
