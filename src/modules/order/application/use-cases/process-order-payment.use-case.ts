import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { DataTransmissionStatus } from '../../domain/enums/data-transmission-status.enum';
import { PaymentFailedException } from '../../domain/exceptions/order.exception';
import { ProcessPaymentResultDto } from '../dtos/order.dto';
import { ExternalDataTransmissionService } from '../services/external-data-transmission.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { PaymentDomainService } from '../../../payment/domain/services/payment-domain.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { CouponDomainService } from '../../../coupon/domain/services/coupon-domain.service';
import { CartDomainService } from '../../../cart/domain/services/cart-domain.service';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { OrderDomainService } from '../../domain/services/order-domain.service';

/**
 * FR-O-005: 주문 결제 처리
 *
 * 주문에 대한 결제를 처리합니다.
 * 처리 순서:
 * 1. 포인트 차감 (Payment 도메인)
 * 2. 재고 차감 (Product 도메인)
 * 3. 쿠폰 사용 처리 (Coupon 도메인, 적용된 경우)
 * 4. 주문 상태 → PAID
 * 5. 장바구니 항목 삭제 (Cart 도메인)
 * 6. 외부 데이터 플랫폼 전송 (비동기)
 *
 * 포인트 또는 재고 차감 실패 시 트랜잭션 롤백
 * 외부 데이터 전송 실패는 주문에 영향 없음
 */
@Injectable()
export class ProcessOrderPaymentUseCase {
  constructor(
    private readonly orderDomainService: OrderDomainService,
    private readonly externalDataTransmissionService: ExternalDataTransmissionService,
    private readonly userDomainService: UserDomainService,
    private readonly paymentDomainService: PaymentDomainService,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly couponDomainService: CouponDomainService,
    private readonly cartDomainService: CartDomainService,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(
    userId: number,
    orderId: number,
  ): Promise<ProcessPaymentResultDto> {
    // 1. 주문 조회
    const order = await this.orderDomainService.findOrderById(orderId);

    // 2. 소유권 검증
    order.validateOwnership(userId);

    // 3. 주문 상태 검증 (PENDING만 결제 가능)
    order.validateCanPay();

    // 4. 사용자 조회 및 잔액 검증
    const user = await this.userDomainService.findUserById(userId);
    user.validateBalance(order.totalAmount);

    let paymentId = 0;
    let remainingBalance = 0;
    let dataTransmissionStatus = DataTransmissionStatus.PENDING;

    try {
      // 5. 트랜잭션 시작
      // 트랜잭션 내에서 포인트 차감, 재고 차감, 쿠폰 사용, 주문 상태 변경, 장바구니 삭제를 원자적으로 처리
      const result = await this.prismaService.transaction(async (tx) => {
        // 5-1. 포인트 차감
        const pointResult = await this.userDomainService.deductUserPoint(
          userId,
          order.totalAmount,
        );

        // 5-2. 결제 정보 생성
        const payment = await this.paymentDomainService.processPayment(
          userId,
          orderId,
          order.totalAmount,
          pointResult.previousBalance,
          pointResult.currentBalance,
        );

        // 5-3. 재고 차감 (병렬 처리)
        await this.inventoryDomainService.deductStocks(
          order.items.map((item) => ({
            optionId: item.optionId,
            quantity: item.quantity,
          })),
          orderId,
        );

        // 5-4. 쿠폰 사용 처리 (적용된 경우)
        if (order.hasCouponApplied()) {
          await this.couponDomainService.useCoupon(
            userId,
            order.appliedUserCouponId!,
            orderId,
          );
        }

        // 5-5. 주문 상태 변경 (PAID)
        order.changeStatus(OrderStatus.PAID);
        await this.orderDomainService.saveOrder(order);

        // 5-6. 장바구니 항목 삭제
        await this.cartDomainService.deleteCartItemsByOrderItems(
          userId,
          order.items.map((item) => ({
            productOptionId: item.optionId,
            quantity: item.quantity,
          })),
        );

        return {
          paymentId: payment.paymentId,
          remainingBalance: payment.currentBalance,
          paidAt: payment.paidAt,
        };
      });

      paymentId = result.paymentId;
      remainingBalance = result.remainingBalance;
      const paidAt = result.paidAt;

      // 6. 외부 데이터 전송 (비동기, 실패해도 주문은 완료)
      try {
        const transmissionResult =
          await this.externalDataTransmissionService.transmitOrderData(orderId);
        dataTransmissionStatus = transmissionResult.transmissionStatus;
      } catch (error) {
        // 외부 전송 실패는 무시
        dataTransmissionStatus = DataTransmissionStatus.FAILED;
      }

      // 7. 결제 완료 응답
      return {
        orderId,
        paymentId,
        paidAmount: order.totalAmount,
        remainingBalance,
        status: OrderStatus.PAID,
        paidAt,
        dataTransmissionStatus,
      };
    } catch (error) {
      // 트랜잭션 롤백 (Prisma가 자동 처리)
      throw new PaymentFailedException(orderId, (error as Error).message);
    }
  }
}
