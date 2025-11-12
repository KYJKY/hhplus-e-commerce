import { Inject, Injectable } from '@nestjs/common';
import type { IPointTransactionRepository } from '../repositories/point-transaction.repository.interface';
import type { IPaymentRepository } from '../repositories/payment.repository.interface';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import {
  PaymentNotFoundException,
  PaymentAccessDeniedException,
  InsufficientBalanceException,
  InvalidPaymentAmountException,
  InvalidChargeAmountException,
  ChargeAmountUnitErrorException,
  MaxBalanceExceededException,
  DuplicatePaymentException,
  InvalidAmountException,
  InvalidDateRangeException,
} from '../exceptions';
import { PointTransaction } from '../entities/point-transaction.entity';
import { Payment } from '../entities/payment.entity';

/**
 * Payment Domain Service
 *
 * Domain Layer의 비즈니스 로직을 담당
 * - Repository와 직접 상호작용
 * - 도메인 규칙 강제
 * - Use Case에서 호출됨
 */
@Injectable()
export class PaymentDomainService {
  constructor(
    @Inject('IPointTransactionRepository')
    private readonly pointTransactionRepository: IPointTransactionRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    private readonly userDomainService: UserDomainService,
  ) {}

  /**
   * FR-PAY-001: 포인트 잔액 조회
   */
  async getBalance(userId: number): Promise<{
    userId: number;
    balance: number;
    lastUpdatedAt: string | null;
  }> {
    const user = await this.userDomainService.findUserById(userId);

    // 최근 거래 조회
    const latestTransactions =
      await this.pointTransactionRepository.findLatestByUserId(userId, 1);
    const lastUpdatedAt =
      latestTransactions.length > 0
        ? latestTransactions[0].createdAt
        : user.createdAt;

    return {
      userId: user.id,
      balance: user.getPoint(),
      lastUpdatedAt,
    };
  }

  /**
   * FR-PAY-002: 포인트 충전
   */
  async chargePoint(
    userId: number,
    amount: number,
  ): Promise<{
    pointTransactionId: number;
    userId: number;
    amount: number;
    previousBalance: number;
    currentBalance: number;
    transactionType: 'CHARGE';
    createdAt: string;
  }> {
    // 사용자 확인
    const user = await this.userDomainService.findUserById(userId);

    // 충전 금액 검증
    if (amount < 1000 || amount > 1000000) {
      throw new InvalidChargeAmountException(amount);
    }

    if (amount % 1000 !== 0) {
      throw new ChargeAmountUnitErrorException(amount);
    }

    const previousBalance = user.getPoint();

    // 최대 보유 가능 포인트 확인
    if (previousBalance + amount > 10000000) {
      throw new MaxBalanceExceededException(previousBalance, amount);
    }

    // 포인트 충전
    const { currentBalance } = await this.userDomainService.chargeUserPoint(
      userId,
      amount,
    );

    // 포인트 거래 내역 생성
    const now = new Date().toISOString();
    const transaction = PointTransaction.create({
      id: 0, // Repository에서 자동 생성
      userId,
      transactionType: 'CHARGE',
      amount,
      balanceAfter: currentBalance,
      relatedOrderId: null,
      description: '포인트 충전',
      createdAt: now,
    });

    const savedTransaction =
      await this.pointTransactionRepository.create(transaction);

    return {
      pointTransactionId: savedTransaction.id,
      userId: savedTransaction.userId,
      amount: savedTransaction.amount,
      previousBalance,
      currentBalance,
      transactionType: 'CHARGE',
      createdAt: savedTransaction.createdAt,
    };
  }

  /**
   * FR-PAY-003: 포인트 사용 내역 조회
   */
  async getPointTransactions(params: {
    userId: number;
    transactionType?: 'CHARGE' | 'USE' | 'REFUND';
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<{
    transactions: Array<{
      pointTransactionId: number;
      transactionType: 'CHARGE' | 'USE' | 'REFUND';
      amount: number;
      balance: number;
      relatedOrderId: number | null;
      description: string | null;
      createdAt: string;
    }>;
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    // 사용자 확인
    await this.userDomainService.findUserById(params.userId);

    // 날짜 범위 검증
    if (params.startDate && params.endDate) {
      if (new Date(params.startDate) > new Date(params.endDate)) {
        throw new InvalidDateRangeException(params.startDate, params.endDate);
      }
    }

    const page = params.page ?? 1;
    const size = params.size ?? 20;

    const result = await this.pointTransactionRepository.findWithPagination({
      userId: params.userId,
      transactionType: params.transactionType,
      startDate: params.startDate,
      endDate: params.endDate,
      page,
      size,
    });

    return {
      transactions: result.transactions.map((t) => ({
        pointTransactionId: t.id,
        transactionType: t.transactionType,
        amount: t.amount,
        balance: t.balanceAfter,
        relatedOrderId: t.relatedOrderId,
        description: t.description,
        createdAt: t.createdAt,
      })),
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  /**
   * FR-PAY-004: 결제 처리 (내부 API)
   */
  async processPayment(
    userId: number,
    orderId: number,
    amount: number,
  ): Promise<{
    paymentId: number;
    orderId: number;
    userId: number;
    amount: number;
    paymentMethod: string;
    previousBalance: number;
    currentBalance: number;
    status: 'SUCCESS';
    paidAt: string;
  }> {
    // 결제 금액 검증
    if (amount < 1) {
      throw new InvalidPaymentAmountException(amount);
    }

    // 사용자 확인
    const user = await this.userDomainService.findUserById(userId);

    // 중복 결제 확인
    const existingPayment = await this.paymentRepository.findByOrderId(orderId);
    if (existingPayment) {
      throw new DuplicatePaymentException(orderId);
    }

    const previousBalance = user.getPoint();

    // 잔액 확인
    if (previousBalance < amount) {
      throw new InsufficientBalanceException(previousBalance, amount);
    }

    // 포인트 차감
    const { currentBalance } = await this.userDomainService.deductUserPoint(
      userId,
      amount,
    );

    const now = new Date().toISOString();

    // 결제 정보 생성
    const payment = Payment.create({
      id: 0, // Repository에서 자동 생성
      orderId,
      userId,
      paymentMethod: 'POINT',
      paymentStatus: 'SUCCESS',
      paidAmount: amount,
      failureReason: null,
      paidAt: now,
      createdAt: now,
      updatedAt: null,
    });

    const savedPayment = await this.paymentRepository.create(payment);

    // 포인트 거래 내역 생성 (USE)
    const transaction = PointTransaction.create({
      id: 0,
      userId,
      transactionType: 'USE',
      amount,
      balanceAfter: currentBalance,
      relatedOrderId: orderId,
      description: `주문 ${orderId} 결제`,
      createdAt: now,
    });

    await this.pointTransactionRepository.create(transaction);

    return {
      paymentId: savedPayment.id,
      orderId: savedPayment.orderId,
      userId: savedPayment.userId,
      amount: savedPayment.paidAmount,
      paymentMethod: savedPayment.paymentMethod,
      previousBalance,
      currentBalance,
      status: 'SUCCESS',
      paidAt: savedPayment.paidAt,
    };
  }

  /**
   * FR-PAY-005: 결제 내역 조회
   */
  async getPayments(params: {
    userId: number;
    status?: 'SUCCESS' | 'FAILED' | 'CANCELLED';
    page?: number;
    size?: number;
  }): Promise<{
    payments: Array<{
      paymentId: number;
      orderId: number;
      orderNumber: string;
      amount: number;
      paymentMethod: string;
      status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
      paidAt: string;
    }>;
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    // 사용자 확인
    await this.userDomainService.findUserById(params.userId);

    const page = params.page ?? 1;
    const size = params.size ?? 20;

    const result = await this.paymentRepository.findWithPagination({
      userId: params.userId,
      status: params.status,
      page,
      size,
    });

    return {
      payments: result.payments.map((p) => ({
        paymentId: p.id,
        orderId: p.orderId,
        orderNumber: `ORD-${p.orderId}`, // 실제로는 Order 엔티티에서 가져와야 함
        amount: p.paidAmount,
        paymentMethod: p.paymentMethod,
        status: p.paymentStatus,
        paidAt: p.paidAt,
      })),
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  /**
   * FR-PAY-006: 결제 상세 조회
   */
  async getPaymentDetail(
    userId: number,
    paymentId: number,
  ): Promise<{
    paymentId: number;
    orderId: number;
    orderNumber: string;
    userId: number;
    amount: number;
    paymentMethod: string;
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
    paidAt: string;
    pointTransactionId: number | null;
    failureReason: string | null;
  }> {
    // 사용자 확인
    await this.userDomainService.findUserById(userId);

    // 결제 조회
    const payment = await this.paymentRepository.findByIdAndUserId(
      paymentId,
      userId,
    );
    if (!payment) {
      // 결제가 존재하는지 확인
      const existsPayment = await this.paymentRepository.exists(paymentId);
      if (existsPayment) {
        throw new PaymentAccessDeniedException(paymentId);
      }
      throw new PaymentNotFoundException(paymentId);
    }

    // 관련 포인트 거래 내역 조회
    const transactions = await this.pointTransactionRepository.findByOrderId(
      payment.orderId,
    );
    const useTransaction = transactions.find((t) => t.isUse());

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      orderNumber: `ORD-${payment.orderId}`, // 실제로는 Order 엔티티에서 가져와야 함
      userId: payment.userId,
      amount: payment.paidAmount,
      paymentMethod: payment.paymentMethod,
      status: payment.paymentStatus,
      paidAt: payment.paidAt,
      pointTransactionId: useTransaction?.id ?? null,
      failureReason: payment.failureReason,
    };
  }

  /**
   * FR-PAY-008: 결제 실패 처리 (내부 API)
   */
  async processPaymentFailure(
    userId: number,
    orderId: number,
    amount: number,
    failureReason: string,
  ): Promise<{
    paymentId: number;
    orderId: number;
    userId: number;
    amount: number;
    status: 'FAILED';
    failureReason: string;
    failedAt: string;
  }> {
    // 사용자 확인
    await this.userDomainService.findUserById(userId);

    const now = new Date().toISOString();

    // 실패한 결제 정보 생성
    const payment = Payment.create({
      id: 0,
      orderId,
      userId,
      paymentMethod: 'POINT',
      paymentStatus: 'FAILED',
      paidAmount: amount,
      failureReason,
      paidAt: now,
      createdAt: now,
      updatedAt: null,
    });

    const savedPayment = await this.paymentRepository.create(payment);

    return {
      paymentId: savedPayment.id,
      orderId: savedPayment.orderId,
      userId: savedPayment.userId,
      amount: savedPayment.paidAmount,
      status: 'FAILED',
      failureReason: savedPayment.failureReason!,
      failedAt: savedPayment.paidAt,
    };
  }

  /**
   * FR-PAY-009: 포인트 차감 검증 (내부 API)
   */
  async validatePointDeduction(
    userId: number,
    amount: number,
  ): Promise<{
    userId: number;
    currentBalance: number;
    requestedAmount: number;
    isAvailable: boolean;
    shortage: number;
  }> {
    // 금액 검증
    if (amount < 1) {
      throw new InvalidAmountException(amount);
    }

    // 사용자 확인
    const user = await this.userDomainService.findUserById(userId);

    const currentBalance = user.getPoint();
    const isAvailable = currentBalance >= amount;
    const shortage = isAvailable ? 0 : amount - currentBalance;

    return {
      userId: user.id,
      currentBalance,
      requestedAmount: amount,
      isAvailable,
      shortage,
    };
  }

  /**
   * FR-PAY-010: 결제 통계 조회
   */
  async getPaymentStatistics(userId: number): Promise<{
    userId: number;
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
    lastPaymentAt: string | null;
  }> {
    // 사용자 확인
    const user = await this.userDomainService.findUserById(userId);

    const statistics =
      await this.paymentRepository.getPaymentStatistics(userId);

    return {
      userId: user.id,
      ...statistics,
    };
  }

  /**
   * 포인트 복원 (내부 API) - 주문 취소 또는 재고 복원 시 사용
   */
  async restorePoint(
    userId: number,
    orderId: number,
    amount: number,
    description: string = '포인트 복원',
  ): Promise<{
    pointTransactionId: number;
    userId: number;
    amount: number;
    previousBalance: number;
    currentBalance: number;
    transactionType: 'REFUND';
  }> {
    // 사용자 확인
    const user = await this.userDomainService.findUserById(userId);

    const previousBalance = user.getPoint();

    // 포인트 복원
    const { currentBalance } = await this.userDomainService.chargeUserPoint(
      userId,
      amount,
    );

    // 포인트 거래 내역 생성 (REFUND)
    const now = new Date().toISOString();
    const transaction = PointTransaction.create({
      id: 0,
      userId,
      transactionType: 'REFUND',
      amount,
      balanceAfter: currentBalance,
      relatedOrderId: orderId,
      description,
      createdAt: now,
    });

    const savedTransaction =
      await this.pointTransactionRepository.create(transaction);

    return {
      pointTransactionId: savedTransaction.id,
      userId: savedTransaction.userId,
      amount: savedTransaction.amount,
      previousBalance,
      currentBalance,
      transactionType: 'REFUND',
    };
  }
}
