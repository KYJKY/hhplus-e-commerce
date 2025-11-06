/**
 * Payment 생성 속성
 */
export interface CreatePaymentProps {
  id: number;
  orderId: number;
  userId: number;
  paymentMethod?: string;
  paymentStatus?: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  paidAmount: number;
  failureReason?: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Payment 수정 속성
 */
export interface UpdatePaymentProps {
  paymentStatus?: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  failureReason?: string | null;
}

/**
 * Payment 도메인 엔티티
 */
export class Payment {
  private constructor(
    public readonly id: number,
    public readonly orderId: number,
    public readonly userId: number,
    public readonly paymentMethod: string,
    public paymentStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED',
    public readonly paidAmount: number,
    public failureReason: string | null,
    public readonly paidAt: string,
    public readonly createdAt: string,
    public updatedAt: string | null,
  ) {}

  /**
   * Payment 엔티티 생성 팩토리 메서드
   */
  static create(props: CreatePaymentProps): Payment {
    // 검증
    this.validatePaidAmount(props.paidAmount);
    this.validatePaymentStatus(props.paymentStatus ?? 'SUCCESS');

    return new Payment(
      props.id,
      props.orderId,
      props.userId,
      props.paymentMethod ?? 'POINT',
      props.paymentStatus ?? 'SUCCESS',
      props.paidAmount,
      props.failureReason ?? null,
      props.paidAt,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  /**
   * 결제 정보 수정
   */
  update(props: UpdatePaymentProps): void {
    if (props.paymentStatus !== undefined) {
      Payment.validatePaymentStatus(props.paymentStatus);
      this.paymentStatus = props.paymentStatus;
    }

    if (props.failureReason !== undefined) {
      this.failureReason = props.failureReason;
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * 결제 실패 처리
   */
  fail(reason: string): void {
    this.paymentStatus = 'FAILED';
    this.failureReason = reason;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 결제 취소 처리
   */
  cancel(reason: string): void {
    if (this.paymentStatus !== 'SUCCESS') {
      throw new Error('Only successful payments can be cancelled');
    }
    this.paymentStatus = 'CANCELLED';
    this.failureReason = reason;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 결제 성공 여부 확인
   */
  isSuccess(): boolean {
    return this.paymentStatus === 'SUCCESS';
  }

  /**
   * 결제 실패 여부 확인
   */
  isFailed(): boolean {
    return this.paymentStatus === 'FAILED';
  }

  /**
   * 결제 취소 여부 확인
   */
  isCancelled(): boolean {
    return this.paymentStatus === 'CANCELLED';
  }

  /**
   * 결제 금액 검증 (1원 이상)
   */
  private static validatePaidAmount(paidAmount: number): void {
    if (paidAmount < 1) {
      throw new Error('Payment amount must be at least 1');
    }
  }

  /**
   * 결제 상태 검증
   */
  private static validatePaymentStatus(
    paymentStatus: string,
  ): void {
    const validStatuses = ['SUCCESS', 'FAILED', 'CANCELLED'];
    if (!validStatuses.includes(paymentStatus)) {
      throw new Error(`Invalid payment status: ${paymentStatus}`);
    }
  }
}
