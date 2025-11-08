import { IRepository } from 'src/common';
import { PointTransaction } from '../entities/point-transaction.entity';

/**
 * PointTransaction Repository 인터페이스
 */
export interface IPointTransactionRepository
  extends IRepository<PointTransaction> {
  /**
   * 사용자 ID로 거래 내역 조회
   */
  findByUserId(userId: number): Promise<PointTransaction[]>;

  /**
   * 사용자 ID와 거래 유형으로 거래 내역 조회
   */
  findByUserIdAndType(
    userId: number,
    transactionType: 'CHARGE' | 'USE' | 'REFUND',
  ): Promise<PointTransaction[]>;

  /**
   * 사용자 ID와 날짜 범위로 거래 내역 조회
   */
  findByUserIdAndDateRange(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<PointTransaction[]>;

  /**
   * 주문 ID로 거래 내역 조회
   */
  findByOrderId(orderId: number): Promise<PointTransaction[]>;

  /**
   * 페이지네이션을 지원하는 거래 내역 조회
   */
  findWithPagination(params: {
    userId: number;
    transactionType?: 'CHARGE' | 'USE' | 'REFUND';
    startDate?: string;
    endDate?: string;
    page: number;
    size: number;
  }): Promise<{
    transactions: PointTransaction[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }>;

  /**
   * 사용자의 최근 거래 조회
   */
  findLatestByUserId(
    userId: number,
    limit: number,
  ): Promise<PointTransaction[]>;
}
