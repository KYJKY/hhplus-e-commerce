import { ApiProperty } from '@nestjs/swagger';

/**
 * 카테고리 정보 DTO
 */
export class Category {
  @ApiProperty({ description: '카테고리 ID', example: 1 })
  categoryId: number;

  @ApiProperty({ description: '카테고리명', example: '상의' })
  categoryName: string;

  @ApiProperty({ description: '표시 순서', example: 1 })
  displayOrder: number;

  @ApiProperty({ description: '해당 카테고리의 상품 수', example: 10 })
  productCount: number;
}

/**
 * 카테고리 목록 조회 응답 DTO
 */
export class GetCategoriesResponse {
  @ApiProperty({ description: '카테고리 목록', type: [Category] })
  categories: Category[];
}
