/**
 * 주문 항목 Entity
 *
 * 주문 생성 시점의 상품 정보를 스냅샷으로 저장
 */
export class OrderItem {
  private constructor(
    private readonly _id: number,
    private readonly _orderId: number,
    private readonly _productId: number,
    private readonly _productName: string,
    private readonly _optionId: number,
    private readonly _optionName: string,
    private readonly _quantity: number,
    private readonly _unitPrice: number,
  ) {}

  get id(): number {
    return this._id;
  }

  get orderId(): number {
    return this._orderId;
  }

  get productId(): number {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
  }

  get optionId(): number {
    return this._optionId;
  }

  get optionName(): string {
    return this._optionName;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): number {
    return this._unitPrice;
  }

  /**
   * 소계 계산 (수량 × 단가)
   */
  get subtotal(): number {
    return this._quantity * this._unitPrice;
  }

  /**
   * 기존 OrderItem 재구성
   */
  static from(
    id: number,
    orderId: number,
    productId: number,
    productName: string,
    optionId: number,
    optionName: string,
    quantity: number,
    unitPrice: number,
  ): OrderItem {
    return new OrderItem(
      id,
      orderId,
      productId,
      productName,
      optionId,
      optionName,
      quantity,
      unitPrice,
    );
  }

  /**
   * 새로운 OrderItem 생성
   */
  static create(
    orderId: number,
    productId: number,
    productName: string,
    optionId: number,
    optionName: string,
    quantity: number,
    unitPrice: number,
  ): OrderItem {
    // 기본 검증
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }
    if (!productName?.trim()) {
      throw new Error('Product name is required');
    }
    if (!optionName?.trim()) {
      throw new Error('Option name is required');
    }

    return new OrderItem(
      0, // ID는 저장 시 생성됨
      orderId,
      productId,
      productName.trim(),
      optionId,
      optionName.trim(),
      quantity,
      unitPrice,
    );
  }
}
