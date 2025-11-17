/**
 * Application Layer DTO - Cart Item
 * Use Case의 입출력을 정의하며, Domain과 Presentation Layer를 격리
 */

/**
 * 장바구니 항목 정보
 */
export class CartItemDto {
  constructor(
    public readonly cartItemId: number,
    public readonly userId: number,
    public readonly productId: number,
    public readonly productName: string,
    public readonly thumbnailUrl: string | null,
    public readonly optionId: number,
    public readonly optionName: string,
    public readonly price: number,
    public readonly quantity: number,
    public readonly subtotal: number,
    public readonly stockQuantity: number,
    public readonly isAvailable: boolean,
    public readonly addedAt: string,
  ) {}
}

/**
 * 장바구니 항목 생성 입력
 */
export class CreateCartItemDto {
  constructor(
    public readonly userId: number,
    public readonly productOptionId: number,
    public readonly quantity: number,
  ) {}
}

/**
 * 장바구니 항목 수량 수정 입력
 */
export class UpdateCartItemQuantityDto {
  constructor(
    public readonly cartItemId: number,
    public readonly quantity: number,
  ) {}
}
