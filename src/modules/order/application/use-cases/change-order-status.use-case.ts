import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderNotFoundException } from '../../domain/exceptions/order.exception';
import { ChangeOrderStatusResultDto } from '../dtos/order.dto';

/**
 * FR-O-004: 주문 상태 변경 (내부 API)
 */
@Injectable()
export class ChangeOrderStatusUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(
    orderId: number,
    newStatus: OrderStatus,
    reason?: string,
  ): Promise<ChangeOrderStatusResultDto> {
    // 주문 조회
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }

    const previousStatus = order.status;

    // 상태 변경 (Entity에서 유효성 검증)
    order.changeStatus(newStatus);

    // 저장
    let paidAt = order.paidAt;
    let completedAt = order.completedAt;

    if (newStatus === OrderStatus.PAID) {
      paidAt = order.updatedAt;
    } else if (newStatus === OrderStatus.COMPLETED) {
      completedAt = order.updatedAt;
    }

    await this.orderRepository.updateStatus(
      orderId,
      newStatus,
      paidAt,
      completedAt,
    );

    return {
      orderId: order.id,
      previousStatus,
      currentStatus: newStatus,
      updatedAt: order.updatedAt,
    };
  }
}
