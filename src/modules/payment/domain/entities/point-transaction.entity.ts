import { Point } from '../value-objects/point.vo';

/**
 * PointTransaction 생성 속성
 */
export interface CreatePointTransactionProps {
  id: number;
  userId: number;
  transactionType: 'CHARGE' | 'USE' | 'REFUND';
  amount: number;
  balanceAfter: number;
  relatedOrderId?: number | null;
  description?: string | null;
  createdAt: string;
}

/**
 * PointTransaction 도메인 엔티티 (VO 적용)
 *
 * Value Object 사용:
 * - Point: 거래 금액 및 잔액 검증
 */
export class PointTransaction {
  private constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly transactionType: 'CHARGE' | 'USE' | 'REFUND',
    private readonly _amount: Point,
    private readonly _balanceAfter: Point,
    public readonly relatedOrderId: number | null,
    public readonly description: string | null,
    public readonly createdAt: string,
  ) {}

  /**
   * 거래 금액 반환 (기존 코드 호환)
   */
  get amount(): number {
    return this._amount.getValue();
  }

  /**
   * 거래 후 잔액 반환 (기존 코드 호환)
   */
  get balanceAfter(): number {
    return this._balanceAfter.getValue();
  }

  /**
   * Amount Point VO 반환
   */
  getAmountVO(): Point {
    return this._amount;
  }

  /**
   * BalanceAfter Point VO 반환
   */
  getBalanceAfterVO(): Point {
    return this._balanceAfter;
  }

  /**
   * PointTransaction 엔티티 생성 팩토리 메서드
   * VO를 생성하여 검증을 VO에 위임
   */
  static create(props: CreatePointTransactionProps): PointTransaction {
    // 검증
    PointTransaction.validateTransactionType(props.transactionType);

    // VO 생성 (검증은 VO 내부에서 수행)
    const amount = Point.create(props.amount);
    const balanceAfter = Point.create(props.balanceAfter);

    return new PointTransaction(
      props.id,
      props.userId,
      props.transactionType,
      amount,
      balanceAfter,
      props.relatedOrderId ?? null,
      props.description ?? null,
      props.createdAt,
    );
  }

  /**
   * 거래 유형 검증
   */
  private static validateTransactionType(transactionType: string): void {
    const validTypes = ['CHARGE', 'USE', 'REFUND'];
    if (!validTypes.includes(transactionType)) {
      throw new Error(`Invalid transaction type: ${transactionType}`);
    }
  }

  /**
   * 충전 거래 여부 확인
   */
  isCharge(): boolean {
    return this.transactionType === 'CHARGE';
  }

  /**
   * 사용 거래 여부 확인
   */
  isUse(): boolean {
    return this.transactionType === 'USE';
  }

  /**
   * 환불 거래 여부 확인
   */
  isRefund(): boolean {
    return this.transactionType === 'REFUND';
  }
}
