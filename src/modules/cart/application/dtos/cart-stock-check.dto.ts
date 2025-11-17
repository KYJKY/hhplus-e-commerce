/**
 * Application Layer DTO - Cart Stock Check
 * Use Case의 입출력을 정의하며, Domain과 Presentation Layer를 격리
 */

/**
 * 장바구니 재고 확인 아이템 정보
 */
export class CartStockItemDto {
  constructor(
    public readonly cartItemId: number,
    public readonly optionId: number,
    public readonly productName: string,
    public readonly optionName: string,
    public readonly requestedQuantity: number,
    public readonly stockQuantity: number,
    public readonly isAvailable: boolean,
    public readonly reason: string | null,
  ) {}
}

/**
 * 장바구니 재고 확인 결과
 */
export class CartStockCheckDto {
  constructor(
    public readonly items: CartStockItemDto[],
    public readonly availableCount: number,
    public readonly unavailableCount: number,
  ) {}
}
