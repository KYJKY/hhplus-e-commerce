import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository } from '../repositories/order.repository.interface';
import { Order } from '../entities/order.entity';
import { OrderNotFoundException } from '../exceptions';

/**
 * Order Domain Service
 *
 * Domain Layer의 비즈니스 로직을 담당
 * - Repository와 직접 상호작용
 * - 도메인 규칙 강제
 * - Use Case에서 호출됨
 */
@Injectable()
export class OrderDomainService {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  /**
   * 주문 조회
   */
  async findOrderById(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new OrderNotFoundException(orderId);
    }

    return order;
  }

  /**
   * 주문 저장
   */
  async saveOrder(order: Order): Promise<void> {
    await this.orderRepository.save(order);
  }
}
