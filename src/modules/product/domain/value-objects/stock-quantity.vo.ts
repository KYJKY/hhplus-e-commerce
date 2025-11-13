import { ValueObject } from '../../../../common/domain/value-object.base';

interface StockQuantityProps {
  quantity: number;
}

/**
 * 재고 수량 Value Object
 *
 * 불변 객체로 재고 수량을 표현
 *
 * 비즈니스 규칙:
 * - 재고는 0 이상이어야 함
 * - 재고 차감/복원 시 원자성 보장 필요
 */
export class StockQuantity extends ValueObject<StockQuantityProps> {
  private constructor(props: StockQuantityProps) {
    super(props);
  }

  /**
   * StockQuantity VO 생성 팩토리 메서드
   * @param quantity - 재고 수량 (0 이상)
   */
  static create(quantity: number): StockQuantity {
    StockQuantity.validate(quantity);
    return new StockQuantity({ quantity });
  }

  /**
   * 0 재고 생성
   */
  static zero(): StockQuantity {
    return new StockQuantity({ quantity: 0 });
  }

  /**
   * 재고 검증 (0 이상)
   */
  private static validate(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    // 정수 검증
    if (!Number.isInteger(quantity)) {
      throw new Error('Stock quantity must be an integer');
    }
  }

  /**
   * 값 반환
   */
  getValue(): number {
    return this.props.quantity;
  }

  /**
   * 재고 차감
   */
  deduct(quantity: number): StockQuantity {
    if (quantity <= 0) {
      throw new Error('Deduct quantity must be greater than 0');
    }

    if (!Number.isInteger(quantity)) {
      throw new Error('Deduct quantity must be an integer');
    }

    if (this.props.quantity < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${this.props.quantity}, Requested: ${quantity}`,
      );
    }

    return StockQuantity.create(this.props.quantity - quantity);
  }

  /**
   * 재고 복원
   */
  restore(quantity: number): StockQuantity {
    if (quantity <= 0) {
      throw new Error('Restore quantity must be greater than 0');
    }

    if (!Number.isInteger(quantity)) {
      throw new Error('Restore quantity must be an integer');
    }

    return StockQuantity.create(this.props.quantity + quantity);
  }

  /**
   * 재고 추가 (입고)
   */
  add(quantity: number): StockQuantity {
    if (quantity <= 0) {
      throw new Error('Add quantity must be greater than 0');
    }

    if (!Number.isInteger(quantity)) {
      throw new Error('Add quantity must be an integer');
    }

    return StockQuantity.create(this.props.quantity + quantity);
  }

  /**
   * 재고 충분 여부 확인
   */
  hasEnough(quantity: number): boolean {
    return this.props.quantity >= quantity;
  }

  /**
   * 재고 없음 여부 확인
   */
  isEmpty(): boolean {
    return this.props.quantity === 0;
  }

  /**
   * 재고 있음 여부 확인
   */
  isAvailable(): boolean {
    return this.props.quantity > 0;
  }

  /**
   * 재고 비교 (같음)
   */
  isEqual(other: StockQuantity): boolean {
    return this.equals(other);
  }

  /**
   * 재고 비교 (크거나 같음)
   */
  isGreaterThanOrEqual(other: StockQuantity): boolean {
    return this.props.quantity >= other.props.quantity;
  }

  /**
   * 재고 비교 (작거나 같음)
   */
  isLessThanOrEqual(other: StockQuantity): boolean {
    return this.props.quantity <= other.props.quantity;
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return `${this.props.quantity} units`;
  }
}
