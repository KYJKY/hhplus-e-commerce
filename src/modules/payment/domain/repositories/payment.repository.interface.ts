import { IRepository } from 'src/common';
import { Payment } from '../entities/payment.entity';

/**
 * Payment Repository 인터페이스
 */
export interface IPaymentRepository extends IRepository<Payment> {
  /**
   * 주문 ID로 결제 조회
   */
  findByOrderId(orderId: number): Promise<Payment | null>;

  /**
   * 사용자 ID로 결제 목록 조회
   */
  findByUserId(userId: number): Promise<Payment[]>;

  /**
   * 사용자 ID와 결제 상태로 결제 목록 조회
   */
  findByUserIdAndStatus(
    userId: number,
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED',
  ): Promise<Payment[]>;

  /**
   * 사용자 ID와 결제 ID로 결제 조회 (권한 확인용)
   */
  findByIdAndUserId(paymentId: number, userId: number): Promise<Payment | null>;

  /**
   * 페이지네이션을 지원하는 결제 내역 조회
   */
  findWithPagination(params: {
    userId: number;
    status?: 'SUCCESS' | 'FAILED' | 'CANCELLED';
    page: number;
    size: number;
  }): Promise<{
    payments: Payment[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }>;

  /**
   * 사용자의 결제 통계 조회
   */
  getPaymentStatistics(userId: number): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
    lastPaymentAt: string | null;
  }>;
}
