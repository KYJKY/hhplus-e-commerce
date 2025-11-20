import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import {
  OrderNotFoundException,
  OrderAccessDeniedException,
} from '../../domain/exceptions/order.exception';
import {
  OrderDetailDto,
  AppliedCouponDto,
  PaymentInfoDto,
} from '../dtos/order.dto';
import { OrderMapper } from '../mappers/order.mapper';
import { CouponDomainService } from '../../../coupon/domain/services/coupon-domain.service';
import { PaymentDomainService } from '../../../payment/domain/services/payment-domain.service';

/**
 * FR-O-003: 주문 상세 조회
 */
@Injectable()
export class GetOrderDetailUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly orderMapper: OrderMapper,
    private readonly couponDomainService: CouponDomainService,
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(userId: number, orderId: number): Promise<OrderDetailDto> {
    // 주문 조회
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }

    // 소유권 검증
    if (!order.isOwnedBy(userId)) {
      throw new OrderAccessDeniedException(orderId, userId);
    }

    // 쿠폰 정보 조회 (적용된 경우)
    let appliedCoupon: AppliedCouponDto | null = null;
    if (order.hasCouponApplied() && order.appliedCouponId) {
      try {
        const coupon = await this.couponDomainService.findCouponById(
          order.appliedCouponId,
        );
        appliedCoupon = {
          couponId: coupon.id,
          couponName: coupon.couponName,
          discountRate: coupon.discountRate,
        };
      } catch (error) {
        // 쿠폰 정보 조회 실패 시 null 처리
        appliedCoupon = null;
      }
    }

    // 결제 정보 조회 (결제 완료된 경우)
    // Note: PaymentDomainService에는 orderId로 결제 정보를 조회하는 메서드가 없습니다.
    // getPayments를 사용하여 사용자의 결제 목록에서 해당 주문의 결제를 찾습니다.
    let payment: PaymentInfoDto | null = null;
    if (order.paidAt) {
      try {
        const paymentsResult = await this.paymentDomainService.getPayments({
          userId,
          status: 'SUCCESS',
          page: 1,
          size: 100, // 충분히 큰 값으로 설정
        });

        // orderId와 일치하는 결제 정보 찾기
        const orderPayment = paymentsResult.payments.find(
          (p) => p.orderId === orderId,
        );

        if (orderPayment) {
          payment = {
            paymentId: orderPayment.paymentId,
            paidAmount: orderPayment.amount,
            paymentMethod: orderPayment.paymentMethod,
            paidAt: orderPayment.paidAt,
          };
        }
      } catch (error) {
        // 결제 정보 조회 실패 시 null 처리
        payment = null;
      }
    }

    return this.orderMapper.toOrderDetailDto(order, appliedCoupon, payment);
  }
}
