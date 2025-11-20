import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderListDto } from '../dtos/order.dto';
import { OrderMapper } from '../mappers/order.mapper';

/**
 * FR-O-002: 주문 목록 조회
 */
@Injectable()
export class GetOrderListUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly orderMapper: OrderMapper,
  ) {}

  async execute(
    userId: number,
    status?: OrderStatus,
    page: number = 1,
    size: number = 20,
  ): Promise<OrderListDto> {
    const result = await this.orderRepository.findOrders({
      userId,
      status,
      page,
      size,
    });

    return {
      orders: result.orders.map((order) =>
        this.orderMapper.toOrderSummaryDto(order),
      ),
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }
}
