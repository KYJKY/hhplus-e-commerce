import { ValueObject } from '../../../../common/domain/value-object.base';

interface QuantityProps {
  value: number;
}

/**
 * Quantity Value Object
 *
 * 장바구니 수량을 표현하는 불변 객체
 *
 * 비즈니스 규칙:
 * - 수량 범위: 1 ~ 99
 */
export class Quantity extends ValueObject<QuantityProps> {
  private static readonly MIN_QUANTITY = 1;
  private static readonly MAX_QUANTITY = 99;

  private constructor(props: QuantityProps) {
    super(props);
  }

  /**
   * Quantity VO 생성 팩토리 메서드
   * @param value - 수량 (1~99)
   */
  static create(value: number): Quantity {
    Quantity.validate(value);
    return new Quantity({ value });
  }

  /**
   * 수량 검증 (1~99)
   */
  private static validate(value: number): void {
    if (!Number.isInteger(value)) {
      throw new Error('Quantity must be an integer');
    }

    if (value < Quantity.MIN_QUANTITY || value > Quantity.MAX_QUANTITY) {
      throw new Error(
        `Quantity must be between ${Quantity.MIN_QUANTITY} and ${Quantity.MAX_QUANTITY}`,
      );
    }
  }

  /**
   * 값 반환
   */
  getValue(): number {
    return this.props.value;
  }

  /**
   * 수량 증가
   */
  add(amount: number): Quantity {
    return Quantity.create(this.props.value + amount);
  }

  /**
   * 수량 감소
   */
  subtract(amount: number): Quantity {
    return Quantity.create(this.props.value - amount);
  }

  /**
   * 다른 Quantity와 더하기
   */
  addQuantity(other: Quantity): Quantity {
    return Quantity.create(this.props.value + other.props.value);
  }

  /**
   * 수량 비교 (같음)
   */
  isEqual(other: Quantity): boolean {
    return this.equals(other);
  }

  /**
   * 수량 비교 (크거나 같음)
   */
  isGreaterThanOrEqual(other: Quantity): boolean {
    return this.props.value >= other.props.value;
  }

  /**
   * 수량 비교 (작거나 같음)
   */
  isLessThanOrEqual(other: Quantity): boolean {
    return this.props.value <= other.props.value;
  }

  /**
   * 최대 수량 여부 확인
   */
  isMaxQuantity(): boolean {
    return this.props.value === Quantity.MAX_QUANTITY;
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return `${this.props.value}`;
  }
}
