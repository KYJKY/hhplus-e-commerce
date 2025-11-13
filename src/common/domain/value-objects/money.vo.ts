import { ValueObject } from '../value-object.base';

interface MoneyProps {
  amount: number;
  currency: string;
}

/**
 * 금액 Value Object
 *
 * 불변 객체로 금액을 표현
 * Payment와 Product 모듈에서 공통으로 사용
 */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  /**
   * Money VO 생성 팩토리 메서드
   * @param amount - 금액 (0 이상)
   * @param currency - 통화 코드 (기본값: KRW)
   */
  static create(amount: number, currency: string = 'KRW'): Money {
    Money.validate(amount, currency);
    return new Money({ amount, currency });
  }

  /**
   * 금액 검증
   */
  private static validate(amount: number, currency: string): void {
    if (amount < 0) {
      throw new Error('Amount must be greater than or equal to 0');
    }
    if (!currency || currency.trim().length === 0) {
      throw new Error('Currency is required');
    }
    if (currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code (e.g., KRW, USD)');
    }
  }

  /**
   * 금액 반환
   */
  getAmount(): number {
    return this.props.amount;
  }

  /**
   * 통화 코드 반환
   */
  getCurrency(): string {
    return this.props.currency;
  }

  /**
   * 값 반환 (금액만)
   */
  getValue(): number {
    return this.props.amount;
  }

  /**
   * 금액 더하기
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(
      this.props.amount + other.props.amount,
      this.props.currency,
    );
  }

  /**
   * 금액 빼기
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.props.amount - other.props.amount;
    if (result < 0) {
      throw new Error('Result amount cannot be negative');
    }
    return Money.create(result, this.props.currency);
  }

  /**
   * 금액 곱하기
   */
  multiply(multiplier: number): Money {
    if (multiplier < 0) {
      throw new Error('Multiplier must be greater than or equal to 0');
    }
    return Money.create(this.props.amount * multiplier, this.props.currency);
  }

  /**
   * 금액 비교 (같음)
   */
  isEqual(other: Money): boolean {
    return this.equals(other);
  }

  /**
   * 금액 비교 (크거나 같음)
   */
  isGreaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.props.amount >= other.props.amount;
  }

  /**
   * 금액 비교 (작거나 같음)
   */
  isLessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.props.amount <= other.props.amount;
  }

  /**
   * 0원 여부 확인
   */
  isZero(): boolean {
    return this.props.amount === 0;
  }

  /**
   * 양수 여부 확인
   */
  isPositive(): boolean {
    return this.props.amount > 0;
  }

  /**
   * 통화 일치 검증
   */
  private assertSameCurrency(other: Money): void {
    if (this.props.currency !== other.props.currency) {
      throw new Error(
        `Currency mismatch: ${this.props.currency} vs ${other.props.currency}`,
      );
    }
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return `${this.props.amount.toLocaleString()} ${this.props.currency}`;
  }
}
