import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma';
import {
  IOrderRepository,
  FindOrdersOptions,
  FindOrdersResult,
  OrderStatistics,
} from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { ShippingAddress } from '../../domain/value-objects/shipping-address.vo';
import { OrderStatus } from '../../domain/enums/order-status.enum';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 주문 저장
   */
  async save(order: Order): Promise<Order> {
    const result = await this.prisma.orders.create({
      data: {
        user_id: BigInt(order.userId),
        order_number: order.orderNumber,
        order_status: order.status,
        recipient_name: order.shippingAddress.recipientName,
        recipient_phone: order.shippingAddress.recipientPhone,
        shipping_postal_code: order.shippingAddress.postalCode,
        shipping_address: order.shippingAddress.addressDefaultText,
        shipping_address_detail: order.shippingAddress.addressDetailText,
        subtotal_amount: order.subtotalAmount,
        discount_amount: order.discountAmount,
        total_amount: order.totalAmount,
        applied_coupon_id: order.appliedCouponId
          ? BigInt(order.appliedCouponId)
          : null,
        created_at: new Date(order.createdAt),
        updated_at: new Date(order.updatedAt),
        order_items: {
          create: order.items.map((item) => ({
            product_id: BigInt(item.productId),
            product_option_id: BigInt(item.optionId),
            product_name: item.productName,
            option_name: item.optionName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        order_items: true,
      },
    });

    return this.toDomain(result);
  }

  /**
   * ID로 주문 조회
   */
  async findById(id: number): Promise<Order | null> {
    const result = await this.prisma.orders.findUnique({
      where: { id: BigInt(id) },
      include: {
        order_items: true,
      },
    });

    return result ? this.toDomain(result) : null;
  }

  /**
   * 주문번호로 주문 조회
   */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const result = await this.prisma.orders.findUnique({
      where: { order_number: orderNumber },
      include: {
        order_items: true,
      },
    });

    return result ? this.toDomain(result) : null;
  }

  /**
   * 사용자의 주문 목록 조회
   */
  async findOrders(options: FindOrdersOptions): Promise<FindOrdersResult> {
    const { userId, status, page = 1, size = 20 } = options;
    const skip = (page - 1) * size;

    const where: any = {
      user_id: BigInt(userId),
    };

    if (status) {
      where.order_status = status;
    }

    const [orders, totalCount] = await Promise.all([
      this.prisma.orders.findMany({
        where,
        include: {
          order_items: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: size,
      }),
      this.prisma.orders.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / size);

    return {
      orders: orders.map((o) => this.toDomain(o)),
      totalCount,
      currentPage: page,
      totalPages,
    };
  }

  /**
   * 오늘 생성된 주문 수 조회
   */
  async countTodayOrders(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.prisma.orders.count({
      where: {
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return count;
  }

  /**
   * 주문 상태 변경
   */
  async updateStatus(
    orderId: number,
    status: OrderStatus,
    paidAt?: string | null,
    completedAt?: string | null,
  ): Promise<void> {
    const updateData: any = {
      order_status: status,
      updated_at: new Date(),
    };

    if (paidAt !== undefined) {
      updateData.paid_at = paidAt ? new Date(paidAt) : null;
    }
    if (completedAt !== undefined) {
      updateData.completed_at = completedAt ? new Date(completedAt) : null;
    }

    await this.prisma.orders.update({
      where: { id: BigInt(orderId) },
      data: updateData,
    });
  }

  /**
   * 사용자 주문 통계 조회
   */
  async getOrderStatistics(userId: number): Promise<OrderStatistics> {
    // 전체 주문 수 및 완료된 주문 수
    const [totalOrders, completedOrders] = await Promise.all([
      this.prisma.orders.count({
        where: { user_id: BigInt(userId) },
      }),
      this.prisma.orders.count({
        where: {
          user_id: BigInt(userId),
          order_status: OrderStatus.COMPLETED,
        },
      }),
    ]);

    // 총 구매 금액 (완료된 주문만)
    const completedOrdersData = await this.prisma.orders.findMany({
      where: {
        user_id: BigInt(userId),
        order_status: OrderStatus.COMPLETED,
      },
      select: {
        total_amount: true,
      },
    });

    const totalSpent = completedOrdersData.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );

    const averageOrderAmount =
      completedOrders > 0 ? totalSpent / completedOrders : 0;

    // 자주 구매한 상품 (상위 5개)
    const mostOrderedProductsData = await this.prisma.order_items.groupBy({
      by: ['product_id', 'product_name'],
      where: {
        orders: {
          user_id: BigInt(userId),
          order_status: OrderStatus.COMPLETED,
        },
      },
      _count: {
        product_id: true,
      },
      orderBy: {
        _count: {
          product_id: 'desc',
        },
      },
      take: 5,
    });

    const mostOrderedProducts = mostOrderedProductsData.map((item) => ({
      productId: Number(item.product_id),
      productName: item.product_name,
      orderCount: item._count.product_id,
    }));

    return {
      userId,
      totalOrders,
      completedOrders,
      totalSpent,
      averageOrderAmount,
      mostOrderedProducts,
    };
  }

  /**
   * Prisma 모델 → Domain Entity 변환
   */
  private toDomain(data: any): Order {
    const orderItems = data.order_items.map((item: any) =>
      OrderItem.from(
        Number(item.id),
        Number(data.id),
        Number(item.product_id),
        item.product_name,
        Number(item.product_option_id),
        item.option_name,
        item.quantity,
        Number(item.unit_price),
      ),
    );

    const shippingAddress = ShippingAddress.create(
      data.recipient_name,
      data.recipient_phone,
      data.shipping_postal_code,
      data.shipping_address,
      data.shipping_address_detail ?? '',
    );

    return Order.from(
      Number(data.id),
      Number(data.user_id),
      data.order_number,
      orderItems,
      shippingAddress,
      Number(data.subtotal_amount),
      Number(data.discount_amount),
      Number(data.total_amount),
      data.applied_coupon_id ? Number(data.applied_coupon_id) : null,
      null, // applied_user_coupon_id는 별도 조회 필요
      data.order_status as OrderStatus,
      data.created_at.toISOString(),
      data.paid_at ? data.paid_at.toISOString() : null,
      data.completed_at ? data.completed_at.toISOString() : null,
      data.updated_at.toISOString(),
    );
  }
}
