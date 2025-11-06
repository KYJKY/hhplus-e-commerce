import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 상품 목록 조회 요청 DTO
 */
export class GetProductListRequestDto {
  @ApiProperty({
    description: '카테고리 ID',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiProperty({
    description: '페이지 번호',
    required: false,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: '페이지 크기',
    required: false,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  size?: number;

  @ApiProperty({
    description: '정렬 기준',
    required: false,
    enum: ['newest', 'popular', 'price_low', 'price_high'],
    example: 'newest',
  })
  @IsOptional()
  @IsEnum(['newest', 'popular', 'price_low', 'price_high'])
  sortBy?: 'newest' | 'popular' | 'price_low' | 'price_high';
}

/**
 * 카테고리 정보 DTO
 */
export class CategoryInfoDto {
  @ApiProperty({ description: '카테고리 ID', example: 1 })
  categoryId: number;

  @ApiProperty({ description: '카테고리명', example: '상의' })
  categoryName: string;
}

/**
 * 상품 목록 아이템 DTO
 */
export class ProductListItemDto {
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

  @ApiProperty({ description: '카테고리 목록', type: [CategoryInfoDto] })
  categories: CategoryInfoDto[];
}

/**
 * 상품 목록 조회 응답 DTO
 */
export class GetProductListResponseDto {
  @ApiProperty({ description: '상품 목록', type: [ProductListItemDto] })
  products: ProductListItemDto[];

  @ApiProperty({ description: '전체 상품 수', example: 100 })
  totalCount: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}

/**
 * 상품 옵션 정보 DTO
 */
export class ProductOptionDto {
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
export class GetProductDetailResponseDto {
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

  @ApiProperty({ description: '카테고리 목록', type: [CategoryInfoDto] })
  categories: CategoryInfoDto[];

  @ApiProperty({ description: '상품 옵션 목록', type: [ProductOptionDto] })
  options: ProductOptionDto[];

  @ApiProperty({
    description: '등록일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  createdAt: string;
}

/**
 * 상품 옵션 조회 응답 DTO
 */
export class GetProductOptionsResponseDto {
  @ApiProperty({ description: '상품 ID', example: 1 })
  productId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({ description: '옵션 목록', type: [ProductOptionDto] })
  options: ProductOptionDto[];
}

/**
 * 상품 옵션 상세 조회 응답 DTO
 */
export class GetProductOptionDetailResponseDto {
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

/**
 * 재고 확인 요청 DTO
 */
export class CheckStockRequestDto {
  @ApiProperty({ description: '확인할 수량', example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

/**
 * 재고 확인 응답 DTO
 */
export class CheckStockResponseDto {
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

/**
 * 재고 차감 요청 DTO
 */
export class DeductStockRequestDto {
  @ApiProperty({ description: '차감할 수량', example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '주문 ID', example: 1 })
  @IsNumber()
  orderId: number;
}

/**
 * 재고 차감 응답 DTO
 */
export class DeductStockResponseDto {
  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '차감 전 재고', example: 100 })
  previousStock: number;

  @ApiProperty({ description: '차감 수량', example: 5 })
  deductedQuantity: number;

  @ApiProperty({ description: '차감 후 재고', example: 95 })
  currentStock: number;
}

/**
 * 재고 복원 요청 DTO
 */
export class RestoreStockRequestDto {
  @ApiProperty({ description: '복원할 수량', example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '주문 ID', example: 1 })
  @IsNumber()
  orderId: number;
}

/**
 * 재고 복원 응답 DTO
 */
export class RestoreStockResponseDto {
  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '복원 전 재고', example: 95 })
  previousStock: number;

  @ApiProperty({ description: '복원 수량', example: 5 })
  restoredQuantity: number;

  @ApiProperty({ description: '복원 후 재고', example: 100 })
  currentStock: number;
}

/**
 * 인기 상품 정보 DTO
 */
export class PopularProductDto {
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
export class GetPopularProductsResponseDto {
  @ApiProperty({
    description: '집계 기간',
    example: '2024-11-02 ~ 2024-11-05',
  })
  period: string;

  @ApiProperty({ description: '인기 상품 목록', type: [PopularProductDto] })
  products: PopularProductDto[];
}

/**
 * 카테고리 정보 DTO
 */
export class CategoryDto {
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
export class GetCategoriesResponseDto {
  @ApiProperty({ description: '카테고리 목록', type: [CategoryDto] })
  categories: CategoryDto[];
}

/**
 * 카테고리별 상품 수 조회 응답 DTO
 */
export class GetCategoryProductCountResponseDto {
  @ApiProperty({ description: '카테고리 ID', example: 1 })
  categoryId: number;

  @ApiProperty({ description: '카테고리명', example: '상의' })
  categoryName: string;

  @ApiProperty({ description: '상품 개수', example: 10 })
  productCount: number;
}
