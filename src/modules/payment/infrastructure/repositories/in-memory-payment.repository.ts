import { Injectable } from '@nestjs/common';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { BaseInMemoryRepository } from 'src/common';

@Injectable()
export class InMemoryPaymentRepository
  extends BaseInMemoryRepository<Payment>
  implements IPaymentRepository
{
  constructor() {
    super();
    this.initializeData();
  }

  /**
   * 초기 테스트 데이터 로드
   */
  private initializeData(): void {
    // 초기 데이터는 비워둠 (주문 후 결제가 생성되므로)
    (this as any).currentId = 1;
  }

  /**
   * Plain object를 Payment 엔티티로 변환
   */
  private toEntity(data: any): Payment {
    return Payment.create({
      id: data.id,
      orderId: data.orderId,
      userId: data.userId,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      paidAmount: data.paidAmount,
      failureReason: data.failureReason,
      paidAt: data.paidAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 단일 엔티티 조회 오버라이드
   */
  override async findById(id: number): Promise<Payment | null> {
    const entity = await super.findById(id);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 조건에 맞는 단일 엔티티 조회 오버라이드
   */
  override async findOne(
    predicate: (entity: Payment) => boolean,
  ): Promise<Payment | null> {
    const entity = await super.findOne(predicate);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 모든 엔티티 조회 오버라이드
   */
  override async findAll(): Promise<Payment[]> {
    const entities = await super.findAll();
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 조건에 맞는 엔티티 목록 조회 오버라이드
   */
  override async findMany(
    predicate: (entity: Payment) => boolean,
  ): Promise<Payment[]> {
    const entities = await super.findMany(predicate);
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 엔티티 수정 오버라이드
   */
  override async update(
    id: number,
    entityData: Partial<Payment>,
  ): Promise<Payment | null> {
    const entity = await super.update(id, entityData);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 주문 ID로 결제 조회
   */
  async findByOrderId(orderId: number): Promise<Payment | null> {
    return await this.findOne((p) => p.orderId === orderId);
  }

  /**
   * 사용자 ID로 결제 목록 조회
   */
  async findByUserId(userId: number): Promise<Payment[]> {
    const payments = await this.findMany((p) => p.userId === userId);
    // 최신 결제가 먼저 표시 (paidAt 내림차순)
    return payments.sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );
  }

  /**
   * 사용자 ID와 결제 상태로 결제 목록 조회
   */
  async findByUserIdAndStatus(
    userId: number,
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED',
  ): Promise<Payment[]> {
    const payments = await this.findMany(
      (p) => p.userId === userId && p.paymentStatus === status,
    );
    return payments.sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );
  }

  /**
   * 사용자 ID와 결제 ID로 결제 조회 (권한 확인용)
   */
  async findByIdAndUserId(
    paymentId: number,
    userId: number,
  ): Promise<Payment | null> {
    return await this.findOne((p) => p.id === paymentId && p.userId === userId);
  }

  /**
   * 페이지네이션을 지원하는 결제 내역 조회
   */
  async findWithPagination(params: {
    userId: number;
    status?: 'SUCCESS' | 'FAILED' | 'CANCELLED';
    page: number;
    size: number;
  }): Promise<{
    payments: Payment[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    let payments = await this.findMany((p) => p.userId === params.userId);

    // 상태 필터
    if (params.status) {
      payments = payments.filter((p) => p.paymentStatus === params.status);
    }

    // 최신 결제가 먼저 표시 (paidAt 내림차순)
    payments.sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );

    const totalCount = payments.length;
    const totalPages = Math.ceil(totalCount / params.size);
    const startIndex = (params.page - 1) * params.size;
    const endIndex = startIndex + params.size;

    return {
      payments: payments.slice(startIndex, endIndex),
      totalCount,
      currentPage: params.page,
      totalPages,
    };
  }

  /**
   * 사용자의 결제 통계 조회
   */
  async getPaymentStatistics(userId: number): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
    lastPaymentAt: string | null;
  }> {
    const allPayments = await this.findMany((p) => p.userId === userId);
    const successPayments = allPayments.filter((p) => p.isSuccess());
    const failedPayments = allPayments.filter((p) => p.isFailed());

    const totalAmount = successPayments.reduce(
      (sum, p) => sum + p.paidAmount,
      0,
    );
    const averagePaymentAmount =
      successPayments.length > 0 ? totalAmount / successPayments.length : 0;

    // 최근 결제 찾기
    const sortedPayments = [...allPayments].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );
    const lastPaymentAt =
      sortedPayments.length > 0 ? sortedPayments[0].paidAt : null;

    return {
      totalPayments: allPayments.length,
      totalAmount,
      successfulPayments: successPayments.length,
      failedPayments: failedPayments.length,
      averagePaymentAmount,
      lastPaymentAt,
    };
  }
}
