import { ValueObject } from '../../../../common/domain/value-object.base';
import { Money } from '../../../../common/domain/value-objects/money.vo';
import {
  InvalidChargeAmountException,
  ChargeAmountUnitErrorException,
  MaxBalanceExceededException,
  InsufficientBalanceException,
} from '../exceptions';

interface PointProps {
  amount: number;
}

/**
 * 포인트 Value Object
 *
 * 불변 객체로 포인트를 표현
 *
 * 비즈니스 규칙:
 * - 충전 금액: 1,000 ~ 1,000,000 KRW
 * - 충전 단위: 1,000 KRW 단위만 가능
 * - 최대 잔액: 10,000,000 KRW
 */
export class Point extends ValueObject<PointProps> {
  private static readonly MIN_CHARGE_AMOUNT = 1000;
  private static readonly MAX_CHARGE_AMOUNT = 1_000_000;
  private static readonly CHARGE_UNIT = 1000;
  private static readonly MAX_BALANCE = 10_000_000;

  private constructor(props: PointProps) {
    super(props);
  }

  /**
   * Point VO 생성 팩토리 메서드
   * @param amount - 포인트 금액 (0 이상)
   */
  static create(amount: number): Point {
    Point.validate(amount);
    return new Point({ amount });
  }

  /**
   * 0 포인트 생성
   */
  static zero(): Point {
    return new Point({ amount: 0 });
  }

  /**
   * 포인트 검증 (0 이상, 최대 잔액 이하)
   */
  private static validate(amount: number): void {
    if (amount < 0) {
      throw new Error('Point amount cannot be negative');
    }
    if (amount > Point.MAX_BALANCE) {
      throw new Error(
        `Point amount cannot exceed ${Point.MAX_BALANCE.toLocaleString()}`,
      );
    }
  }

  /**
   * 충전 금액 검증
   * 도메인 예외를 직접 던짐
   */
  static validateChargeAmount(amount: number): void {
    if (amount < Point.MIN_CHARGE_AMOUNT || amount > Point.MAX_CHARGE_AMOUNT) {
      throw new InvalidChargeAmountException(amount);
    }
    if (amount % Point.CHARGE_UNIT !== 0) {
      throw new ChargeAmountUnitErrorException(amount);
    }
  }

  /**
   * 값 반환
   */
  getValue(): number {
    return this.props.amount;
  }

  /**
   * Money 객체로 변환
   */
  toMoney(): Money {
    return Money.create(this.props.amount, 'KRW');
  }

  /**
   * 포인트 충전
   * 도메인 예외를 직접 던짐
   */
  charge(amount: number): Point {
    Point.validateChargeAmount(amount);

    const newAmount = this.props.amount + amount;
    if (newAmount > Point.MAX_BALANCE) {
      throw new MaxBalanceExceededException(this.props.amount, amount);
    }

    return Point.create(newAmount);
  }

  /**
   * 포인트 사용
   * 도메인 예외를 직접 던짐
   */
  use(amount: number): Point {
    if (amount <= 0) {
      throw new Error('Use amount must be greater than 0');
    }

    if (this.props.amount < amount) {
      throw new InsufficientBalanceException(this.props.amount, amount);
    }

    return Point.create(this.props.amount - amount);
  }

  /**
   * 포인트 환불
   * 도메인 예외를 직접 던짐
   */
  refund(amount: number): Point {
    if (amount <= 0) {
      throw new Error('Refund amount must be greater than 0');
    }

    const newAmount = this.props.amount + amount;
    if (newAmount > Point.MAX_BALANCE) {
      throw new MaxBalanceExceededException(this.props.amount, amount);
    }

    return Point.create(newAmount);
  }

  /**
   * 포인트 더하기
   * 도메인 예외를 직접 던짐
   */
  add(other: Point): Point {
    const newAmount = this.props.amount + other.props.amount;
    if (newAmount > Point.MAX_BALANCE) {
      throw new MaxBalanceExceededException(
        this.props.amount,
        other.props.amount,
      );
    }
    return Point.create(newAmount);
  }

  /**
   * 포인트 빼기
   */
  subtract(other: Point): Point {
    const newAmount = this.props.amount - other.props.amount;
    if (newAmount < 0) {
      throw new Error('Result amount cannot be negative');
    }
    return Point.create(newAmount);
  }

  /**
   * 포인트 비교 (같음)
   */
  isEqual(other: Point): boolean {
    return this.equals(other);
  }

  /**
   * 포인트 비교 (크거나 같음)
   */
  isGreaterThanOrEqual(other: Point): boolean {
    return this.props.amount >= other.props.amount;
  }

  /**
   * 포인트 비교 (작거나 같음)
   */
  isLessThanOrEqual(other: Point): boolean {
    return this.props.amount <= other.props.amount;
  }

  /**
   * 잔액 충분 여부 확인
   */
  hasSufficientBalance(amount: number): boolean {
    return this.props.amount >= amount;
  }

  /**
   * 0 포인트 여부 확인
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
   * 문자열 표현
   */
  toString(): string {
    return `${this.props.amount.toLocaleString()} P`;
  }
}
