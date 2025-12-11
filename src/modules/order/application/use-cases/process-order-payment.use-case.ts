import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { PaymentFailedException } from '../../domain/exceptions/order.exception';
import { ProcessPaymentResultDto } from '../dtos/order.dto';
import { PostPaymentService } from '../services/post-payment.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { OrderDomainService } from '../../domain/services/order-domain.service';
import { OrderPaymentDomainService } from '../../domain/services/order-payment-domain.service';

/**
 * FR-O-005: 주문 결제 처리
 *
 * 주문에 대한 결제를 처리합니다.
 *
 * 책임:
 * - 주문 조회 및 검증 조율
 * - 결제 완료 처리 위임 (OrderPaymentDomainService)
 * - 비동기 후처리 위임 (PostPaymentService)
 *
 * 처리 순서:
 * 1. 주문 조회 및 검증
 * 2. 사용자 잔액 검증
 * 3. 결제 완료 처리 (트랜잭션) - OrderPaymentDomainService
 * 4. 비동기 후처리 - PostPaymentService
 */
@Injectable()
export class ProcessOrderPaymentUseCase {
  private readonly logger = new Logger(ProcessOrderPaymentUseCase.name);

  constructor(
    private readonly orderDomainService: OrderDomainService,
    private readonly orderPaymentDomainService: OrderPaymentDomainService,
    private readonly userDomainService: UserDomainService,
    private readonly postPaymentService: PostPaymentService,
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

      // 4. 비동기 후처리 (외부 전송, 랭킹 업데이트)
      const orderItems = order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      const postProcessResult =
        await this.postPaymentService.executePostPaymentTasks(
          orderId,
          orderItems,
        );

      // 5. 결제 완료 응답
      return {
        orderId,
        paymentId: paymentResult.paymentId,
        paidAmount: order.totalAmount,
        remainingBalance: paymentResult.remainingBalance,
        status: OrderStatus.PAID,
        paidAt: paymentResult.paidAt,
        dataTransmissionStatus: postProcessResult.dataTransmissionStatus,
      };
    } catch (error) {
      this.logger.error(`Payment failed for order ${orderId}:`, error);
      throw new PaymentFailedException(orderId, (error as Error).message);
    }
  }
}
