import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  OrderNotFoundException,
  InvalidOrderStatusException,
} from '../../domain/exceptions/order.exception';
import { CompleteOrderResultDto } from '../dtos/order.dto';

/**
 * FR-O-006: 주문 완료 처리 (내부 API)
 */
@Injectable()
export class CompleteOrderUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(orderId: number): Promise<CompleteOrderResultDto> {
    // 주문 조회
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }

    // 완료 처리 가능 여부 확인
    if (!order.canComplete()) {
      throw new InvalidOrderStatusException(
        orderId,
        order.status,
        OrderStatus.PAID,
      );
    }

    // 상태 변경
    order.changeStatus(OrderStatus.COMPLETED);

    // 저장
    await this.orderRepository.updateStatus(
      orderId,
      OrderStatus.COMPLETED,
      order.paidAt,
      order.updatedAt, // completedAt
    );

    return {
      orderId: order.id,
      status: OrderStatus.COMPLETED,
      completedAt: order.updatedAt,
    };
  }
}
