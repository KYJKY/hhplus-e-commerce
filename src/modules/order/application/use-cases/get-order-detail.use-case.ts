import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import {
  OrderNotFoundException,
  OrderAccessDeniedException,
} from '../../domain/exceptions/order.exception';
import { OrderDetailDto } from '../dtos/order.dto';
import { OrderMapper } from '../mappers/order.mapper';

/**
 * FR-O-003: 주문 상세 조회
 */
@Injectable()
export class GetOrderDetailUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly orderMapper: OrderMapper,
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
    let appliedCoupon = null;
    if (order.hasCouponApplied()) {
      // TODO: Coupon 모듈에서 쿠폰 정보를 조회해야 함
      // 현재는 null로 처리
      appliedCoupon = null;
    }

    // 결제 정보 조회 (결제 완료된 경우)
    let payment = null;
    if (order.paidAt) {
      // TODO: Payment 모듈에서 결제 정보를 조회해야 함
      // 현재는 null로 처리
      payment = null;
    }

    return this.orderMapper.toOrderDetailDto(order, appliedCoupon, payment);
  }
}
