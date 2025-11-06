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
 * PointTransaction 도메인 엔티티
 */
export class PointTransaction {
  private constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly transactionType: 'CHARGE' | 'USE' | 'REFUND',
    public readonly amount: number,
    public readonly balanceAfter: number,
    public readonly relatedOrderId: number | null,
    public readonly description: string | null,
    public readonly createdAt: string,
  ) {}

  /**
   * PointTransaction 엔티티 생성 팩토리 메서드
   */
  static create(props: CreatePointTransactionProps): PointTransaction {
    // 검증
    this.validateAmount(props.amount);
    this.validateBalanceAfter(props.balanceAfter);
    this.validateTransactionType(props.transactionType);

    return new PointTransaction(
      props.id,
      props.userId,
      props.transactionType,
      props.amount,
      props.balanceAfter,
      props.relatedOrderId ?? null,
      props.description ?? null,
      props.createdAt,
    );
  }

  /**
   * 거래 금액 검증 (양수)
   */
  private static validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Transaction amount must be greater than 0');
    }
  }

  /**
   * 거래 후 잔액 검증 (0 이상)
   */
  private static validateBalanceAfter(balanceAfter: number): void {
    if (balanceAfter < 0) {
      throw new Error('Balance after transaction cannot be negative');
    }
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
