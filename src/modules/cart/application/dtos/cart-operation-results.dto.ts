/**
 * Application Layer DTO - Cart Operation Results
 * Use Case의 입출력을 정의하며, Domain과 Presentation Layer를 격리
 */

/**
 * 장바구니 항목 추가 결과
 */
export class AddedCartItemDto {
  constructor(
    public readonly cartItemId: number,
    public readonly productId: number,
    public readonly productName: string,
    public readonly optionId: number,
    public readonly optionName: string,
    public readonly price: number,
    public readonly quantity: number,
    public readonly addedAt: string,
  ) {}
}

/**
 * 장바구니 항목 수량 수정 결과
 */
export class UpdatedCartItemQuantityDto {
  constructor(
    public readonly cartItemId: number,
    public readonly optionId: number,
    public readonly previousQuantity: number,
    public readonly quantity: number,
    public readonly price: number,
    public readonly subtotal: number,
    public readonly updatedAt: string,
  ) {}
}

/**
 * 장바구니 항목 삭제 결과
 */
export class DeletedCartItemDto {
  constructor(
    public readonly success: boolean,
    public readonly deletedCartItemId: number,
  ) {}
}

/**
 * 장바구니 전체 삭제 결과
 */
export class ClearedCartDto {
  constructor(
    public readonly success: boolean,
    public readonly deletedCount: number,
  ) {}
}

/**
 * 장바구니 선택 항목 삭제 결과
 */
export class DeletedSelectedCartItemsDto {
  constructor(
    public readonly success: boolean,
    public readonly deletedCount: number,
    public readonly deletedCartItemIds: number[],
  ) {}
}

/**
 * 장바구니 항목 유효성 검증 결과 (개별 항목)
 */
export class ValidatedCartItemDto {
  constructor(
    public readonly cartItemId: number,
    public readonly optionId: number,
    public readonly productName: string,
    public readonly optionName: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly isValid: boolean,
    public readonly errors: string[],
  ) {}
}

/**
 * 장바구니 항목 유효성 검증 결과 (전체)
 */
export class ValidatedCartItemsDto {
  constructor(
    public readonly isValid: boolean,
    public readonly items: ValidatedCartItemDto[],
  ) {}
}

/**
 * 장바구니 → 주문 전환 결과
 */
export class ConvertedCartToOrderDto {
  constructor(
    public readonly success: boolean,
    public readonly deletedCount: number,
    public readonly orderId: number,
  ) {}
}
