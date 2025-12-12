import { BaseEvent } from '../../../../common/cls';

/**
 * 결제 완료 이벤트
 *
 * 결제가 성공적으로 완료된 후 발행되는 도메인 이벤트입니다.
 * BaseEvent를 상속하여 Trace ID가 자동으로 주입됩니다.
 * 트랜잭션 커밋 후에 발행되어야 합니다.
 *
 * 이 이벤트를 구독하여 다음과 같은 부가 작업을 수행할 수 있습니다:
 * - 외부 데이터 플랫폼 전송
 * - 상품 판매 랭킹 업데이트
 * - 알림 발송 등
 */
export class PaymentCompletedEvent extends BaseEvent {
  static readonly EVENT_NAME = 'payment.completed';
  readonly eventName = PaymentCompletedEvent.EVENT_NAME;

  constructor(
    /** 주문 ID */
    public readonly orderId: number,
    /** 사용자 ID */
    public readonly userId: number,
    /** 결제 ID */
    public readonly paymentId: number,
    /** 결제 총액 */
    public readonly totalAmount: number,
    /** 주문 항목 목록 */
    public readonly orderItems: Array<{
      productId: number;
      quantity: number;
    }>,
    /** 결제 완료 시각 */
    public readonly paidAt: Date,
  ) {
    super(); // Trace ID 자동 주입
  }
}
