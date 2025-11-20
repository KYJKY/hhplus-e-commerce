import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatisticsDto } from '../dtos/order.dto';

/**
 * FR-O-009: 주문 통계 조회
 */
@Injectable()
export class GetOrderStatisticsUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(userId: number): Promise<OrderStatisticsDto> {
    const statistics = await this.orderRepository.getOrderStatistics(userId);

    return {
      userId: statistics.userId,
      totalOrders: statistics.totalOrders,
      completedOrders: statistics.completedOrders,
      totalSpent: statistics.totalSpent,
      averageOrderAmount: statistics.averageOrderAmount,
      mostOrderedProducts: statistics.mostOrderedProducts,
    };
  }
}
