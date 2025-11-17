import { ApiProperty } from '@nestjs/swagger';

/**
 * 인기 상품 정보 DTO
 */
export class PopularProduct {
  @ApiProperty({ description: '순위', example: 1 })
  rank: number;

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

  @ApiProperty({ description: '판매 수량', example: 150 })
  salesCount: number;

  @ApiProperty({ description: '판매 금액', example: 4350000 })
  salesAmount: number;
}

/**
 * 인기 상품 조회 응답 DTO
 */
export class GetPopularProductsResponse {
  @ApiProperty({
    description: '집계 기간',
    example: '2024-11-02 ~ 2024-11-05',
  })
  period: string;

  @ApiProperty({ description: '인기 상품 목록', type: [PopularProduct] })
  products: PopularProduct[];
}
