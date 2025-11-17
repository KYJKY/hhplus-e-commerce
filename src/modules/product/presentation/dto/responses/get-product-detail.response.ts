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
 * 상품 옵션 정보 DTO
 */
export class ProductOption {
  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

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

/**
 * 상품 상세 조회 응답 DTO
 */
export class GetProductDetailResponse {
  @ApiProperty({ description: '상품 ID', example: 1 })
  productId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({
    description: '상품 설명',
    example: '편안한 착용감의 베이직 티셔츠',
    nullable: true,
  })
  productDescription: string | null;

  @ApiProperty({
    description: '썸네일 이미지 URL',
    example: 'https://example.com/images/tshirt1.jpg',
    nullable: true,
  })
  thumbnailUrl: string | null;

  @ApiProperty({ description: '판매 활성화 여부', example: true })
  isActive: boolean;

  @ApiProperty({ description: '조회수', example: 151 })
  viewCount: number;

  @ApiProperty({ description: '카테고리 목록', type: [CategoryInfo] })
  categories: CategoryInfo[];

  @ApiProperty({ description: '상품 옵션 목록', type: [ProductOption] })
  options: ProductOption[];

  @ApiProperty({
    description: '등록일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  createdAt: string;
}
