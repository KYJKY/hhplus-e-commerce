import { Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import {
  OrderDto,
  OrderItemDto,
  OrderSummaryDto,
  ShippingAddressDto,
  AppliedCouponDto,
  OrderDetailDto,
  PaymentInfoDto,
} from '../dtos/order.dto';

@Injectable()
export class OrderMapper {
  /**
   * OrderItem Entity → OrderItemDto
   */
  toOrderItemDto(item: OrderItem): OrderItemDto {
    return {
      orderItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      optionId: item.optionId,
      optionName: item.optionName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    };
  }

  /**
   * ShippingAddress VO → ShippingAddressDto
   */
  toShippingAddressDto(address: Order['shippingAddress']): ShippingAddressDto {
    return {
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      postalCode: address.postalCode,
      addressDefaultText: address.addressDefaultText,
      addressDetailText: address.addressDetailText,
    };
  }

  /**
   * Order Entity → OrderDto
   */
  toOrderDto(order: Order, appliedCoupon?: AppliedCouponDto | null): OrderDto {
    return {
      orderId: order.id,
      userId: order.userId,
      orderNumber: order.orderNumber,
      items: order.items.map((item) => this.toOrderItemDto(item)),
      shippingAddress: this.toShippingAddressDto(order.shippingAddress),
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      appliedCoupon: appliedCoupon ?? null,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      completedAt: order.completedAt,
    };
  }

  /**
   * Order Entity → OrderSummaryDto
   */
  toOrderSummaryDto(order: Order): OrderSummaryDto {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      itemCount: order.itemCount,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    };
  }

  /**
   * Order Entity → OrderDetailDto
   */
  toOrderDetailDto(
    order: Order,
    appliedCoupon: AppliedCouponDto | null,
    payment: PaymentInfoDto | null,
  ): OrderDetailDto {
    return {
      ...this.toOrderDto(order, appliedCoupon),
      payment,
    };
  }
}
