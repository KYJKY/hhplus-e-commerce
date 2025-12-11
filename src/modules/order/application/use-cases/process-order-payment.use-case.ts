import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { DataTransmissionStatus } from '../../domain/enums/data-transmission-status.enum';
import { PaymentFailedException } from '../../domain/exceptions/order.exception';
import { PaymentCompletedEvent } from '../../domain/events/payment-completed.event';
import { ProcessPaymentResultDto } from '../dtos/order.dto';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { OrderDomainService } from '../../domain/services/order-domain.service';
import { OrderPaymentDomainService } from '../../domain/services/order-payment-domain.service';
import { TracedEventEmitter } from '../../../../common/cls';

/**
 * FR-O-005: 주문 결제 처리
 *
 * 주문에 대한 결제를 처리합니다.
 *
 * 책임:
 * - 주문 조회 및 검증 조율
 * - 결제 완료 처리 위임 (OrderPaymentDomainService)
 * - 결제 완료 이벤트 발행 (PaymentCompletedEvent)
 *
 * 처리 순서:
 * 1. 주문 조회 및 검증
 * 2. 사용자 잔액 검증
 * 3. 결제 완료 처리 (트랜잭션) - OrderPaymentDomainService
 * 4. 결제 완료 이벤트 발행 - TracedEventEmitter (비동기 후처리는 이벤트 핸들러에서 처리)
 */
@Injectable()
export class ProcessOrderPaymentUseCase {
  private readonly logger = new Logger(ProcessOrderPaymentUseCase.name);

  constructor(
    private readonly orderDomainService: OrderDomainService,
    private readonly orderPaymentDomainService: OrderPaymentDomainService,
    private readonly userDomainService: UserDomainService,
    private readonly tracedEventEmitter: TracedEventEmitter,
  ) {}

  async execute(
    userId: number,
    orderId: number,
  ): Promise<ProcessPaymentResultDto> {
    // 1. 주문 조회 및 검증
    const order = await this.orderDomainService.findOrderById(orderId);
    order.validateOwnership(userId);
    order.validateCanPay();

    // 2. 사용자 잔액 검증
    const user = await this.userDomainService.findUserById(userId);
    user.validateBalance(order.totalAmount);

    try {
      // 3. 결제 완료 처리 (트랜잭션)
      const paymentResult =
        await this.orderPaymentDomainService.completePayment(userId, order);

      // 4. 결제 완료 이벤트 발행 (트랜잭션 커밋 후)
      // - 비동기로 처리되므로 결제 응답에 영향 없음
      // - 이벤트 핸들러에서 외부 전송 및 랭킹 업데이트 처리
      // - TracedEventEmitter를 통해 자동 로깅 및 Trace ID 전파
      const orderItems = order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const event = new PaymentCompletedEvent(
        orderId,
        userId,
        paymentResult.paymentId,
        order.totalAmount,
        orderItems,
        new Date(paymentResult.paidAt),
      );

      this.tracedEventEmitter.emit(event, {
        orderNumber: order.orderNumber,
        paidAmount: order.totalAmount,
      });

      this.logger.log(
        `PaymentCompletedEvent emitted for order ${orderId} [traceId=${event.traceId}]`,
      );

      // 5. 결제 완료 응답
      // - dataTransmissionStatus는 비동기 처리 중이므로 PENDING 반환
      return {
        orderId,
        paymentId: paymentResult.paymentId,
        paidAmount: order.totalAmount,
        remainingBalance: paymentResult.remainingBalance,
        status: OrderStatus.PAID,
        paidAt: paymentResult.paidAt,
        dataTransmissionStatus: DataTransmissionStatus.PENDING,
      };
    } catch (error) {
      this.logger.error(`Payment failed for order ${orderId}:`, error);
      throw new PaymentFailedException(orderId, (error as Error).message);
    }
  }
}
