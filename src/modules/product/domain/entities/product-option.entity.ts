/**
 * ProductOption 생성 속성
 */
export interface CreateProductOptionProps {
  id: number;
  productId: number;
  optionName: string;
  optionDescription?: string | null;
  priceAmount: number;
  stockQuantity?: number;
  isAvailable?: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * ProductOption 수정 속성
 */
export interface UpdateProductOptionProps {
  optionName?: string;
  optionDescription?: string | null;
  priceAmount?: number;
  stockQuantity?: number;
  isAvailable?: boolean;
}

/**
 * ProductOption 도메인 엔티티
 */
export class ProductOption {
  private constructor(
    public readonly id: number,
    public readonly productId: number,
    public optionName: string,
    public optionDescription: string | null,
    public priceAmount: number,
    public stockQuantity: number,
    public isAvailable: boolean,
    public readonly createdAt: string,
    public updatedAt: string | null,
  ) {}

  /**
   * ProductOption 엔티티 생성 팩토리 메서드
   */
  static create(props: CreateProductOptionProps): ProductOption {
    // 검증
    this.validateOptionName(props.optionName);
    this.validatePriceAmount(props.priceAmount);
    this.validateStockQuantity(props.stockQuantity ?? 0);

    return new ProductOption(
      props.id,
      props.productId,
      props.optionName,
      props.optionDescription ?? null,
      props.priceAmount,
      props.stockQuantity ?? 0,
      props.isAvailable ?? true,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  /**
   * 옵션 정보 수정
   */
  update(props: UpdateProductOptionProps): void {
    if (props.optionName !== undefined) {
      ProductOption.validateOptionName(props.optionName);
      this.optionName = props.optionName;
    }

    if (props.optionDescription !== undefined) {
      this.optionDescription = props.optionDescription;
    }

    if (props.priceAmount !== undefined) {
      ProductOption.validatePriceAmount(props.priceAmount);
      this.priceAmount = props.priceAmount;
    }

    if (props.stockQuantity !== undefined) {
      ProductOption.validateStockQuantity(props.stockQuantity);
      this.stockQuantity = props.stockQuantity;
    }

    if (props.isAvailable !== undefined) {
      this.isAvailable = props.isAvailable;
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * 재고 차감
   */
  deductStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (this.stockQuantity < quantity) {
      throw new Error('Insufficient stock');
    }

    this.stockQuantity -= quantity;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 재고 복원
   */
  restoreStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    this.stockQuantity += quantity;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 재고 충분 여부 확인
   */
  hasEnoughStock(quantity: number): boolean {
    return this.isAvailable && this.stockQuantity >= quantity;
  }

  /**
   * 옵션명 검증 (1~100자)
   */
  private static validateOptionName(optionName: string): void {
    if (
      !optionName ||
      optionName.trim().length < 1 ||
      optionName.trim().length > 100
    ) {
      throw new Error('Option name must be between 1 and 100 characters');
    }
  }

  /**
   * 가격 검증 (0 이상)
   */
  private static validatePriceAmount(priceAmount: number): void {
    if (priceAmount < 0) {
      throw new Error('Price amount must be greater than or equal to 0');
    }
  }

  /**
   * 재고 수량 검증 (0 이상)
   */
  private static validateStockQuantity(stockQuantity: number): void {
    if (stockQuantity < 0) {
      throw new Error('Stock quantity must be greater than or equal to 0');
    }
  }
}
