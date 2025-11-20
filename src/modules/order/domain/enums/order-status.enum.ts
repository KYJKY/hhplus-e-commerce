/**
 * 주문 상태
 *
 * 상태 전이 규칙:
 * - PENDING → PAID → COMPLETED (정상 흐름)
 * - PENDING → FAILED (결제 실패)
 * - PENDING → CANCELLED (주문 취소, 1차 범위 제외)
 * - 역방향 전이 불가 (단방향)
 * - COMPLETED, FAILED, CANCELLED는 최종 상태
 */
export enum OrderStatus {
  PENDING = 'PENDING', // 주문 생성 (결제 대기)
  PAID = 'PAID', // 결제 완료
  COMPLETED = 'COMPLETED', // 주문 완료 (배송 완료)
  FAILED = 'FAILED', // 결제 실패
  CANCELLED = 'CANCELLED', // 주문 취소 (1차 범위 제외)
}

/**
 * 주문 상태 전이 검증
 */
export class OrderStatusTransition {
  private static readonly VALID_TRANSITIONS: Map<OrderStatus, OrderStatus[]> =
    new Map([
      [OrderStatus.PENDING, [OrderStatus.PAID, OrderStatus.FAILED, OrderStatus.CANCELLED]],
      [OrderStatus.PAID, [OrderStatus.COMPLETED]],
      [OrderStatus.COMPLETED, []],
      [OrderStatus.FAILED, []],
      [OrderStatus.CANCELLED, []],
    ]);

  /**
   * 상태 전이가 유효한지 검증
   */
  static isValidTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): boolean {
    const allowedTransitions = this.VALID_TRANSITIONS.get(currentStatus);
    return allowedTransitions?.includes(newStatus) ?? false;
  }

  /**
   * 최종 상태인지 확인
   */
  static isFinalStatus(status: OrderStatus): boolean {
    return [
      OrderStatus.COMPLETED,
      OrderStatus.FAILED,
      OrderStatus.CANCELLED,
    ].includes(status);
  }

  /**
   * 결제 가능한 상태인지 확인
   */
  static isPayableStatus(status: OrderStatus): boolean {
    return status === OrderStatus.PENDING;
  }

  /**
   * 완료 처리 가능한 상태인지 확인
   */
  static isCompletableStatus(status: OrderStatus): boolean {
    return status === OrderStatus.PAID;
  }
}
