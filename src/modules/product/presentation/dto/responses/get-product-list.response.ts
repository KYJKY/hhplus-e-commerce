import { ApiProperty } from '@nestjs/swagger';

/**
 * 카테고리 정보 DTO
 */
export class CategoryInfo {
  @ApiProperty({ description: '카테고리 ID', example: 1 })
  categoryId: number;

  @ApiProperty({ description: '카테고리명', example: '상의' })
  categoryName: string;
}

/**
 * 상품 목록 아이템 DTO
 */
export class ProductListItem {
  @ApiProperty({ description: '상품 ID', example: 1 })
  productId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({
    description: '썸네일 이미지 URL',
    example: 'https://example.com/images/tshirt1.jpg',
    nullable: true,
  })
  thumbnailUrl: string | null;

  @ApiProperty({ description: '최저 가격', example: 29000 })
  minPrice: number;

  @ApiProperty({ description: '최고 가격', example: 29000 })
  maxPrice: number;

  @ApiProperty({ description: '조회수', example: 150 })
  viewCount: number;

  @ApiProperty({ description: '카테고리 목록', type: [CategoryInfo] })
  categories: CategoryInfo[];
}

/**
 * 상품 목록 조회 응답 DTO
 */
export class GetProductListResponse {
  @ApiProperty({ description: '상품 목록', type: [ProductListItem] })
  products: ProductListItem[];

  @ApiProperty({ description: '전체 상품 수', example: 100 })
  totalCount: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}
