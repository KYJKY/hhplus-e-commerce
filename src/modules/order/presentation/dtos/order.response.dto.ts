import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  OrderDto,
  OrderItemDto,
  OrderSummaryDto,
  OrderListDto,
  OrderDetailDto,
  ShippingAddressDto,
  AppliedCouponDto,
  PaymentInfoDto,
  ProcessPaymentResultDto,
  ChangeOrderStatusResultDto,
  CompleteOrderResultDto,
  OrderStatisticsDto,
} from '../../application/dtos/order.dto';

/**
 * 배송지 응답 DTO
 */
export class ShippingAddressResponseDto implements ShippingAddressDto {
  @ApiProperty() recipientName: string;
  @ApiProperty() recipientPhone: string;
  @ApiProperty() postalCode: string;
  @ApiProperty() addressDefaultText: string;
  @ApiProperty() addressDetailText: string;
}

/**
 * 주문 항목 응답 DTO
 */
export class OrderItemResponseDto implements OrderItemDto {
  @ApiProperty() orderItemId: number;
  @ApiProperty() productId: number;
  @ApiProperty() productName: string;
  @ApiProperty() optionId: number;
  @ApiProperty() optionName: string;
  @ApiProperty() quantity: number;
  @ApiProperty() unitPrice: number;
  @ApiProperty() subtotal: number;
}

/**
 * 적용된 쿠폰 응답 DTO
 */
export class AppliedCouponResponseDto implements AppliedCouponDto {
  @ApiProperty() couponId: number;
  @ApiProperty() couponName: string;
  @ApiProperty() discountRate: number;
}

/**
 * 주문 기본 응답 DTO
 */
export class OrderResponseDto implements OrderDto {
  @ApiProperty() orderId: number;
  @ApiProperty() userId: number;
  @ApiProperty() orderNumber: string;
  @ApiProperty({ type: [OrderItemResponseDto] }) items: OrderItemResponseDto[];
  @ApiProperty({ type: ShippingAddressResponseDto })
  shippingAddress: ShippingAddressResponseDto;
  @ApiProperty() subtotalAmount: number;
  @ApiProperty() discountAmount: number;
  @ApiProperty() totalAmount: number;
  @ApiProperty({ type: AppliedCouponResponseDto, nullable: true })
  appliedCoupon: AppliedCouponResponseDto | null;
  @ApiProperty({ enum: OrderStatus }) status: OrderStatus;
  @ApiProperty() createdAt: string;
  @ApiProperty({ nullable: true }) paidAt: string | null;
  @ApiProperty({ nullable: true }) completedAt: string | null;

  static from(dto: OrderDto): OrderResponseDto {
    const response = new OrderResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 주문 요약 응답 DTO
 */
export class OrderSummaryResponseDto implements OrderSummaryDto {
  @ApiProperty() orderId: number;
  @ApiProperty() orderNumber: string;
  @ApiProperty() totalAmount: number;
  @ApiProperty({ enum: OrderStatus }) status: OrderStatus;
  @ApiProperty() itemCount: number;
  @ApiProperty() createdAt: string;
  @ApiProperty({ nullable: true }) paidAt: string | null;

  static from(dto: OrderSummaryDto): OrderSummaryResponseDto {
    const response = new OrderSummaryResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 주문 목록 응답 DTO
 */
export class OrderListResponseDto implements OrderListDto {
  @ApiProperty({ type: [OrderSummaryResponseDto] })
  orders: OrderSummaryResponseDto[];
  @ApiProperty() totalCount: number;
  @ApiProperty() currentPage: number;
  @ApiProperty() totalPages: number;

  static from(dto: OrderListDto): OrderListResponseDto {
    const response = new OrderListResponseDto();
    response.orders = dto.orders.map((o) => OrderSummaryResponseDto.from(o));
    response.totalCount = dto.totalCount;
    response.currentPage = dto.currentPage;
    response.totalPages = dto.totalPages;
    return response;
  }
}

/**
 * 결제 정보 응답 DTO
 */
export class PaymentInfoResponseDto implements PaymentInfoDto {
  @ApiProperty() paymentId: number;
  @ApiProperty() paidAmount: number;
  @ApiProperty() paymentMethod: string;
  @ApiProperty() paidAt: string;
}

/**
 * 주문 상세 응답 DTO
 */
export class OrderDetailResponseDto
  extends OrderResponseDto
  implements OrderDetailDto
{
  @ApiProperty({ type: PaymentInfoResponseDto, nullable: true })
  payment: PaymentInfoResponseDto | null;

  static from(dto: OrderDetailDto): OrderDetailResponseDto {
    const response = new OrderDetailResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 주문 결제 처리 응답 DTO
 */
export class ProcessPaymentResponseDto implements ProcessPaymentResultDto {
  @ApiProperty() orderId: number;
  @ApiProperty() paymentId: number;
  @ApiProperty() paidAmount: number;
  @ApiProperty() remainingBalance: number;
  @ApiProperty({ enum: OrderStatus }) status: OrderStatus;
  @ApiProperty() paidAt: string;
  @ApiProperty({ enum: ['SUCCESS', 'FAILED', 'PENDING'] })
  dataTransmissionStatus: 'SUCCESS' | 'FAILED' | 'PENDING';

  static from(dto: ProcessPaymentResultDto): ProcessPaymentResponseDto {
    const response = new ProcessPaymentResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 주문 상태 변경 응답 DTO
 */
export class ChangeOrderStatusResponseDto
  implements ChangeOrderStatusResultDto
{
  @ApiProperty() orderId: number;
  @ApiProperty({ enum: OrderStatus }) previousStatus: OrderStatus;
  @ApiProperty({ enum: OrderStatus }) currentStatus: OrderStatus;
  @ApiProperty() updatedAt: string;

  static from(dto: ChangeOrderStatusResultDto): ChangeOrderStatusResponseDto {
    const response = new ChangeOrderStatusResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 주문 완료 응답 DTO
 */
export class CompleteOrderResponseDto implements CompleteOrderResultDto {
  @ApiProperty() orderId: number;
  @ApiProperty({ enum: OrderStatus }) status: OrderStatus;
  @ApiProperty() completedAt: string;

  static from(dto: CompleteOrderResultDto): CompleteOrderResponseDto {
    const response = new CompleteOrderResponseDto();
    Object.assign(response, dto);
    return response;
  }
}

/**
 * 주문 통계 응답 DTO
 */
export class OrderStatisticsResponseDto implements OrderStatisticsDto {
  @ApiProperty() userId: number;
  @ApiProperty() totalOrders: number;
  @ApiProperty() completedOrders: number;
  @ApiProperty() totalSpent: number;
  @ApiProperty() averageOrderAmount: number;
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        productId: { type: 'number' },
        productName: { type: 'string' },
        orderCount: { type: 'number' },
      },
    },
  })
  mostOrderedProducts: Array<{
    productId: number;
    productName: string;
    orderCount: number;
  }>;

  static from(dto: OrderStatisticsDto): OrderStatisticsResponseDto {
    const response = new OrderStatisticsResponseDto();
    Object.assign(response, dto);
    return response;
  }
}
