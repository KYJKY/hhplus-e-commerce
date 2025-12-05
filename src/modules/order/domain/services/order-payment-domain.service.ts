import { Injectable, Logger } from '@nestjs/common';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderDomainService } from './order-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { PaymentDomainService } from '../../../payment/domain/services/payment-domain.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { CouponDomainService } from '../../../coupon/domain/services/coupon-domain.service';
import { CartDomainService } from '../../../cart/domain/services/cart-domain.service';
import { PrismaService } from '../../../../common/prisma/prisma.service';

/**
 * 결제 완료 결과
 */
export interface PaymentCompletionResult {
  paymentId: number;
  remainingBalance: number;
  paidAt: string;
}

/**
 * Order Payment Domain Service
 *
 * 결제 완료 프로세스를 캡슐화하는 도메인 서비스
 * - Cross-Aggregate Coordination 담당
 * - 트랜잭션 경계 관리
 * - 비즈니스 규칙(결제 순서, 롤백 정책) 캡슐화
 *
 * 처리 순서:
 * 1. 포인트 차감 (User 도메인)
 * 2. 결제 정보 생성 (Payment 도메인)
 * 3. 재고 차감 (Product 도메인)
 * 4. 쿠폰 사용 처리 (Coupon 도메인)
 * 5. 주문 상태 변경 (Order 도메인)
 * 6. 장바구니 항목 삭제 (Cart 도메인)
 */
@Injectable()
export class OrderPaymentDomainService {
  private readonly logger = new Logger(OrderPaymentDomainService.name);

  constructor(
    private readonly orderDomainService: OrderDomainService,
    private readonly userDomainService: UserDomainService,
    private readonly paymentDomainService: PaymentDomainService,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly couponDomainService: CouponDomainService,
    private readonly cartDomainService: CartDomainService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * 결제 완료 처리 (트랜잭션 포함)
   *
   * 모든 작업이 원자적으로 처리되며, 하나라도 실패 시 전체 롤백됩니다.
   *
   * @param userId 사용자 ID
   * @param order 주문 엔티티 (검증 완료된 상태)
   * @returns 결제 완료 결과
   */
  async completePayment(
    userId: number,
    order: Order,
  ): Promise<PaymentCompletionResult> {
    this.logger.debug(
      `Starting payment completion for order ${order.id}, user ${userId}`,
    );

    return await this.prismaService.transaction(async () => {
      // 1. 포인트 차감
      const pointResult = await this.userDomainService.deductUserPoint(
        userId,
        order.totalAmount,
      );
      this.logger.debug(
        `Point deducted: ${pointResult.previousBalance} -> ${pointResult.currentBalance}`,
      );

      // 2. 결제 정보 생성
      const payment = await this.paymentDomainService.processPayment(
        userId,
        order.id,
        order.totalAmount,
        pointResult.previousBalance,
        pointResult.currentBalance,
      );
      this.logger.debug(`Payment created: ${payment.paymentId}`);

      // 3. 재고 차감
      await this.inventoryDomainService.deductStocks(
        order.items.map((item) => ({
          optionId: item.optionId,
          quantity: item.quantity,
        })),
        order.id,
      );
      this.logger.debug(`Stock deducted for ${order.items.length} items`);

      // 4. 쿠폰 사용 처리 (적용된 경우)
      if (order.hasCouponApplied()) {
        await this.couponDomainService.useCoupon(
          userId,
          order.appliedUserCouponId!,
          order.id,
        );
        this.logger.debug(
          `Coupon used: userCouponId ${order.appliedUserCouponId}`,
        );
      }

      // 5. 주문 상태 변경 (PAID)
      order.changeStatus(OrderStatus.PAID);
      await this.orderDomainService.saveOrder(order);
      this.logger.debug(`Order status changed to PAID`);

      // 6. 장바구니 항목 삭제
      const deletedCount = await this.cartDomainService.deleteCartItemsByOrderItems(
        userId,
        order.items.map((item) => ({
          productOptionId: item.optionId,
          quantity: item.quantity,
        })),
      );
      this.logger.debug(`Cart items deleted: ${deletedCount}`);

      return {
        paymentId: payment.paymentId,
        remainingBalance: payment.currentBalance,
        paidAt: payment.paidAt,
      };
    });
  }
}
