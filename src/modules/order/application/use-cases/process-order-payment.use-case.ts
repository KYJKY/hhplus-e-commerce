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
    // TODO: 다음 모듈들의 서비스를 inject해야 합니다:
    // - IPaymentRepository (포인트 차감)
    // - IProductRepository (재고 차감)
    // - CouponDomainService (쿠폰 사용)
    // - ICartRepository (장바구니 삭제)
    // - PrismaService (트랜잭션 관리)
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

    // 4. 사용자 잔액 조회 및 검증
    // TODO: Payment 모듈에서 사용자 포인트 잔액 조회
    // const balance = await this.paymentRepository.getBalance(userId);
    // if (balance < order.totalAmount) {
    //   throw new InsufficientBalanceException(userId, order.totalAmount, balance);
    // }

    let paymentId = 0;
    let remainingBalance = 0;
    let dataTransmissionStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';

    try {
      // 5. 트랜잭션 시작
      // TODO: Prisma transaction 사용
      // await this.prismaService.$transaction(async (tx) => {
      //
      //   5-1. 포인트 차감
      //   const payment = await this.paymentRepository.deductPoints(
      //     userId,
      //     order.totalAmount,
      //     orderId,
      //     tx,
      //   );
      //   paymentId = payment.id;
      //   remainingBalance = payment.remainingBalance;
      //
      //   5-2. 재고 차감
      //   for (const item of order.items) {
      //     await this.productRepository.deductStock(
      //       item.optionId,
      //       item.quantity,
      //       tx,
      //     );
      //   }
      //
      //   5-3. 쿠폰 사용 처리 (적용된 경우)
      //   if (order.hasCouponApplied()) {
      //     await this.couponDomainService.useCoupon(
      //       userId,
      //       order.appliedUserCouponId!,
      //       orderId,
      //       tx,
      //     );
      //   }
      //
      //   5-4. 주문 상태 변경 (PAID)
      //   await this.orderRepository.updateStatus(
      //     orderId,
      //     OrderStatus.PAID,
      //     new Date().toISOString(),
      //     null,
      //     tx,
      //   );
      //
      //   5-5. 장바구니 항목 삭제
      //   TODO: 주문 생성 시 사용한 장바구니 항목 ID 목록이 필요
      //   await this.cartRepository.deleteByOrderId(orderId, tx);
      // });

      // TODO: 임시 데이터 (트랜잭션 구현 후 제거)
      paymentId = 1;
      remainingBalance = 100000;

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
        paidAt: new Date().toISOString(),
        dataTransmissionStatus,
      };
    } catch (error) {
      // 트랜잭션 롤백 (Prisma가 자동 처리)
      throw new PaymentFailedException(orderId, (error as Error).message);
    }
  }
}
