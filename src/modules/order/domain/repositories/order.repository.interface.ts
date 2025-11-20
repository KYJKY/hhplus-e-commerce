import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums/order-status.enum';

/**
 * 주문 목록 조회 옵션
 */
export interface FindOrdersOptions {
  userId: number;
  status?: OrderStatus;
  page?: number;
  size?: number;
}

/**
 * 주문 목록 조회 결과
 */
export interface FindOrdersResult {
  orders: Order[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

/**
 * 주문 통계
 */
export interface OrderStatistics {
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

/**
 * Order Repository Interface
 */
export interface IOrderRepository {
  /**
   * 주문 저장
   */
  save(order: Order): Promise<Order>;

  /**
   * ID로 주문 조회
   */
  findById(id: number): Promise<Order | null>;

  /**
   * 주문번호로 주문 조회
   */
  findByOrderNumber(orderNumber: string): Promise<Order | null>;

  /**
   * 사용자의 주문 목록 조회
   */
  findOrders(options: FindOrdersOptions): Promise<FindOrdersResult>;

  /**
   * 오늘 생성된 주문 수 조회 (주문번호 시퀀스용)
   */
  countTodayOrders(): Promise<number>;

  /**
   * 주문 상태 변경
   */
  updateStatus(
    orderId: number,
    status: OrderStatus,
    paidAt?: string | null,
    completedAt?: string | null,
  ): Promise<void>;

  /**
   * 사용자 주문 통계 조회
   */
  getOrderStatistics(userId: number): Promise<OrderStatistics>;
}
