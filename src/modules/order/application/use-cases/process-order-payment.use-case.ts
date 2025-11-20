import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  OrderNotFoundException,
  OrderAccessDeniedException,
  InvalidOrderStatusException,
  InsufficientBalanceException,
  PaymentFailedException,
} from '../../domain/exceptions/order.exception';
import { ProcessPaymentResultDto } from '../dtos/order.dto';
import { ExternalDataTransmissionService } from '../services/external-data-transmission.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { PaymentDomainService } from '../../../payment/domain/services/payment-domain.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { CouponDomainService } from '../../../coupon/domain/services/coupon-domain.service';
import { CartDomainService } from '../../../cart/domain/services/cart-domain.service';
import { PrismaService } from '../../../../common/prisma/prisma.service';

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
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
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
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }

    // 2. 소유권 검증
    if (!order.isOwnedBy(userId)) {
      throw new OrderAccessDeniedException(orderId, userId);
    }

    // 3. 주문 상태 검증 (PENDING만 결제 가능)
    if (!order.canPay()) {
      throw new InvalidOrderStatusException(
        orderId,
        order.status,
        OrderStatus.PENDING,
      );
    }

    // 4. 사용자 조회 및 잔액 검증
    const user = await this.userDomainService.findUserById(userId);
    const currentBalance = user.getPoint();

    if (currentBalance < order.totalAmount) {
      throw new InsufficientBalanceException(
        userId,
        order.totalAmount,
        currentBalance,
      );
    }

    let paymentId = 0;
    let remainingBalance = 0;
    let dataTransmissionStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';

    try {
      // 5. 트랜잭션 시작
      // 트랜잭션 내에서 포인트 차감, 재고 차감, 쿠폰 사용, 주문 상태 변경, 장바구니 삭제를 원자적으로 처리
      const result = await this.prismaService.$transaction(async () => {
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

        // 5-3. 재고 차감
        for (const item of order.items) {
          await this.inventoryDomainService.deductStock(
            item.optionId,
            item.quantity,
            orderId,
          );
        }

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
        await this.orderRepository.save(order);

        // 5-6. 장바구니 항목 삭제
        // 주문 항목과 일치하는 장바구니 항목 삭제
        const cartItems =
          await this.cartDomainService.findCartItemsByUserId(userId);

        for (const item of order.items) {
          const cartItem = cartItems.find(
            (ci) =>
              ci.productOptionId === item.optionId &&
              ci.quantity === item.quantity,
          );
          if (cartItem) {
            await this.cartDomainService.deleteCartItem(userId, cartItem.id);
          }
        }

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
        dataTransmissionStatus = 'FAILED';
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
