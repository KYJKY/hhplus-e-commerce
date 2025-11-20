import { OrderStatus } from '../../domain/enums/order-status.enum';

/**
 * 배송지 DTO
 */
export interface ShippingAddressDto {
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  addressDefaultText: string;
  addressDetailText: string;
}

/**
 * 주문 항목 DTO
 */
export interface OrderItemDto {
  orderItemId: number;
  productId: number;
  productName: string;
  optionId: number;
  optionName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * 적용된 쿠폰 정보 DTO
 */
export interface AppliedCouponDto {
  couponId: number;
  couponName: string;
  discountRate: number;
}

/**
 * 주문 기본 DTO
 */
export interface OrderDto {
  orderId: number;
  userId: number;
  orderNumber: string;
  items: OrderItemDto[];
  shippingAddress: ShippingAddressDto;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  appliedCoupon: AppliedCouponDto | null;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  completedAt: string | null;
}

/**
 * 주문 요약 DTO (목록 조회용)
 */
export interface OrderSummaryDto {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
}

/**
 * 주문 목록 조회 결과 DTO
 */
export interface OrderListDto {
  orders: OrderSummaryDto[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

/**
 * 결제 정보 DTO
 */
export interface PaymentInfoDto {
  paymentId: number;
  paidAmount: number;
  paymentMethod: string;
  paidAt: string;
}

/**
 * 주문 상세 DTO (상세 조회용)
 */
export interface OrderDetailDto extends OrderDto {
  payment: PaymentInfoDto | null;
}

/**
 * 주문 생성 결과 DTO
 */
export interface CreateOrderResultDto extends OrderDto {}

/**
 * 주문 결제 처리 결과 DTO
 */
export interface ProcessPaymentResultDto {
  orderId: number;
  paymentId: number;
  paidAmount: number;
  remainingBalance: number;
  status: OrderStatus;
  paidAt: string;
  dataTransmissionStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
}

/**
 * 주문 상태 변경 결과 DTO
 */
export interface ChangeOrderStatusResultDto {
  orderId: number;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  updatedAt: string;
}

/**
 * 주문 완료 처리 결과 DTO
 */
export interface CompleteOrderResultDto {
  orderId: number;
  status: OrderStatus;
  completedAt: string;
}

/**
 * 외부 데이터 전송 결과 DTO
 */
export interface DataTransmissionResultDto {
  orderId: number;
  transmissionStatus: 'SUCCESS' | 'FAILED';
  transmittedAt: string;
  failureReason?: string;
}

/**
 * 주문 통계 DTO
 */
export interface OrderStatisticsDto {
  userId: number;
  totalOrders: number;
  completedOrders: number;
  totalSpent: number;
  averageOrderAmount: number;
  mostOrderedProducts: Array<{
    productId: number;
    productName: string;
    orderCount: number;
  }>;
}
