import { Money } from '../../../../common/domain/value-objects/money.vo';
import { StockQuantity } from '../value-objects/stock-quantity.vo';

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
 * ProductOption 도메인 엔티티 (VO 적용)
 *
 * Value Object 사용:
 * - Money: 가격 검증 및 불변성 보장
 * - StockQuantity: 재고 수량 검증 및 비즈니스 규칙 적용
 */
export class ProductOption {
  private constructor(
    public readonly id: number,
    public readonly productId: number,
    public optionName: string,
    public optionDescription: string | null,
    private _priceAmount: Money,
    private _stockQuantity: StockQuantity,
    public isAvailable: boolean,
    public readonly createdAt: string,
    public updatedAt: string | null,
  ) {}

  // ===== Getter 메서드 (기존 코드 호환성 유지) =====

  /**
   * 가격 금액 반환 (기존 코드 호환)
   */
  get priceAmount(): number {
    return this._priceAmount.getValue();
  }

  /**
   * 재고 수량 반환 (기존 코드 호환)
   */
  get stockQuantity(): number {
    return this._stockQuantity.getValue();
  }

  // ===== VO Getter 메서드 (새로운 코드에서 사용) =====

  /**
   * Money VO 반환
   */
  getPriceAmountVO(): Money {
    return this._priceAmount;
  }

  /**
   * StockQuantity VO 반환
   */
  getStockQuantityVO(): StockQuantity {
    return this._stockQuantity;
  }

  /**
   * ProductOption 엔티티 생성 팩토리 메서드
   * VO를 생성하여 검증을 VO에 위임
   */
  static create(props: CreateProductOptionProps): ProductOption {
    // 검증
    ProductOption.validateOptionName(props.optionName);

    // VO 생성 (검증은 VO 내부에서 수행)
    const priceAmount = Money.create(props.priceAmount);
    const stockQuantity = StockQuantity.create(props.stockQuantity ?? 0);

    return new ProductOption(
      props.id,
      props.productId,
      props.optionName,
      props.optionDescription ?? null,
      priceAmount,
      stockQuantity,
      props.isAvailable ?? true,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  /**
   * 옵션 정보 수정
   * VO를 사용하여 검증
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
      this._priceAmount = Money.create(props.priceAmount);
    }

    if (props.stockQuantity !== undefined) {
      this._stockQuantity = StockQuantity.create(props.stockQuantity);
    }

    if (props.isAvailable !== undefined) {
      this.isAvailable = props.isAvailable;
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * 재고 차감 (VO 사용)
   */
  deductStock(quantity: number): void {
    this._stockQuantity = this._stockQuantity.deduct(quantity);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 재고 복원 (VO 사용)
   */
  restoreStock(quantity: number): void {
    this._stockQuantity = this._stockQuantity.restore(quantity);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 재고 충분 여부 확인 (VO 사용)
   */
  hasEnoughStock(quantity: number): boolean {
    return this.isAvailable && this._stockQuantity.hasEnough(quantity);
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
}
