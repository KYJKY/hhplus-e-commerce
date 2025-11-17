import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 장바구니 아이템 추가 요청 DTO
 */
export class AddCartItemRequestDto {
  @ApiProperty({
    description: '상품 옵션 ID',
    example: 1,
  })
  @IsNumber()
  productOptionId: number;

  @ApiProperty({
    description: '수량 (1-99)',
    example: 2,
    minimum: 1,
    maximum: 99,
  })
  @IsNumber()
  @Min(1)
  @Max(99)
  quantity: number;
}

/**
 * 장바구니 아이템 수량 수정 요청 DTO
 */
export class UpdateCartItemQuantityRequestDto {
  @ApiProperty({
    description: '변경할 수량 (1-99)',
    example: 3,
    minimum: 1,
    maximum: 99,
  })
  @IsNumber()
  @Min(1)
  @Max(99)
  quantity: number;
}

/**
 * 여러 장바구니 아이템 삭제 요청 DTO
 */
export class RemoveMultipleCartItemsRequestDto {
  @ApiProperty({
    description: '삭제할 장바구니 아이템 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  cartItemIds: number[];
}

/**
 * 장바구니 아이템 정보 DTO
 */
export class CartItemDto {
  @ApiProperty({ description: '장바구니 아이템 ID', example: 1 })
  cartItemId: number;

  @ApiProperty({ description: '상품 ID', example: 1 })
  productId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({ description: '썸네일 URL', example: null, nullable: true })
  thumbnailUrl: string | null;

  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '옵션명', example: '화이트 / S' })
  optionName: string;

  @ApiProperty({ description: '가격', example: 29000 })
  price: number;

  @ApiProperty({ description: '수량', example: 2 })
  quantity: number;

  @ApiProperty({ description: '소계 (가격 × 수량)', example: 58000 })
  subtotal: number;

  @ApiProperty({ description: '재고 수량', example: 100 })
  stockQuantity: number;

  @ApiProperty({ description: '구매 가능 여부', example: true })
  isAvailable: boolean;

  @ApiProperty({
    description: '추가일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  addedAt: string;
}

/**
 * 장바구니 조회 응답 DTO
 */
export class GetCartResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '장바구니 아이템 목록', type: [CartItemDto] })
  items: CartItemDto[];

  @ApiProperty({ description: '총 아이템 수', example: 3 })
  totalItems: number;

  @ApiProperty({ description: '총 금액', example: 145000 })
  totalAmount: number;
}

/**
 * 장바구니 아이템 추가 응답 DTO
 */
export class AddCartItemResponseDto {
  @ApiProperty({ description: '장바구니 아이템 ID', example: 1 })
  cartItemId: number;

  @ApiProperty({ description: '상품 ID', example: 1 })
  productId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '옵션명', example: '화이트 / S' })
  optionName: string;

  @ApiProperty({ description: '가격', example: 29000 })
  price: number;

  @ApiProperty({ description: '수량', example: 2 })
  quantity: number;

  @ApiProperty({
    description: '추가일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  addedAt: string;
}

/**
 * 장바구니 아이템 수량 수정 응답 DTO
 */
export class UpdateCartItemQuantityResponseDto {
  @ApiProperty({ description: '장바구니 아이템 ID', example: 1 })
  cartItemId: number;

  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '이전 수량', example: 2 })
  previousQuantity: number;

  @ApiProperty({ description: '변경된 수량', example: 5 })
  quantity: number;

  @ApiProperty({ description: '가격', example: 29000 })
  price: number;

  @ApiProperty({ description: '새 소계', example: 145000 })
  subtotal: number;

  @ApiProperty({
    description: '수정일시',
    example: '2024-11-05T12:00:00.000Z',
  })
  updatedAt: string;
}

/**
 * 장바구니 아이템 삭제 응답 DTO
 */
export class RemoveCartItemResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '삭제된 장바구니 아이템 ID', example: 1 })
  deletedCartItemId: number;
}

/**
 * 여러 장바구니 아이템 삭제 응답 DTO
 */
export class RemoveMultipleCartItemsResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({
    description: '삭제된 아이템 수',
    example: 3,
  })
  deletedCount: number;

  @ApiProperty({
    description: '삭제된 장바구니 아이템 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  deletedCartItemIds: number[];
}

/**
 * 장바구니 비우기 응답 DTO
 */
export class ClearCartResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({
    description: '삭제된 아이템 수',
    example: 5,
  })
  deletedCount: number;
}

/**
 * 장바구니 아이템 수 조회 응답 DTO
 */
export class GetCartItemCountResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '전체 아이템 수', example: 5 })
  totalItems: number;

  @ApiProperty({ description: '구매 가능한 아이템 수', example: 4 })
  availableItems: number;

  @ApiProperty({ description: '구매 불가능한 아이템 수', example: 1 })
  unavailableItems: number;
}

/**
 * 장바구니 재고 확인 아이템 DTO
 */
export class CartStockItemDto {
  @ApiProperty({ description: '장바구니 아이템 ID', example: 1 })
  cartItemId: number;

  @ApiProperty({ description: '옵션 ID', example: 1 })
  optionId: number;

  @ApiProperty({ description: '상품명', example: '베이직 티셔츠' })
  productName: string;

  @ApiProperty({ description: '옵션명', example: '화이트 / S' })
  optionName: string;

  @ApiProperty({ description: '요청 수량', example: 5 })
  requestedQuantity: number;

  @ApiProperty({ description: '재고 수량', example: 3 })
  stockQuantity: number;

  @ApiProperty({ description: '구매 가능 여부', example: false })
  isAvailable: boolean;

  @ApiProperty({
    description: '불가능 사유',
    example: '재고 부족',
    nullable: true,
  })
  reason: string | null;
}

/**
 * 장바구니 재고 확인 응답 DTO
 */
export class CheckCartStockResponseDto {
  @ApiProperty({
    description: '재고 상태별 아이템 목록',
    type: [CartStockItemDto],
  })
  items: CartStockItemDto[];

  @ApiProperty({
    description: '구매 가능한 아이템 수',
    example: 4,
  })
  availableCount: number;

  @ApiProperty({
    description: '구매 불가능한 아이템 수',
    example: 1,
  })
  unavailableCount: number;
}
