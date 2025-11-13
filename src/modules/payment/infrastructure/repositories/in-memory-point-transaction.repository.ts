import { Injectable } from '@nestjs/common';
import { IPointTransactionRepository } from '../../domain/repositories/point-transaction.repository.interface';
import { PointTransaction } from '../../domain/entities/point-transaction.entity';
import { BaseInMemoryRepository } from 'src/common';

@Injectable()
export class InMemoryPointTransactionRepository
  extends BaseInMemoryRepository<PointTransaction>
  implements IPointTransactionRepository
{
  constructor() {
    super();
    this.initializeData();
  }

  /**
   * 초기 테스트 데이터 로드
   */
  private initializeData(): void {
    const now = new Date().toISOString();

    // 사용자 1의 포인트 충전 내역
    const transaction1 = PointTransaction.create({
      id: 1,
      userId: 1,
      transactionType: 'CHARGE',
      amount: 100000,
      balanceAfter: 100000,
      relatedOrderId: null,
      description: '포인트 충전',
      createdAt: now,
    });

    // 사용자 2의 포인트 충전 내역
    const transaction2 = PointTransaction.create({
      id: 2,
      userId: 2,
      transactionType: 'CHARGE',
      amount: 50000,
      balanceAfter: 50000,
      relatedOrderId: null,
      description: '포인트 충전',
      createdAt: now,
    });

    // 사용자 3의 포인트 충전 내역
    const transaction3 = PointTransaction.create({
      id: 3,
      userId: 3,
      transactionType: 'CHARGE',
      amount: 200000,
      balanceAfter: 200000,
      relatedOrderId: null,
      description: '포인트 충전',
      createdAt: now,
    });

    this.entities.set(1, transaction1);
    this.entities.set(2, transaction2);
    this.entities.set(3, transaction3);

    // currentId를 마지막 ID 다음으로 설정
    this.currentId = 4;
  }

  /**
   * Plain object를 PointTransaction 엔티티로 변환
   */
  private toEntity(data: PointTransaction): PointTransaction {
    return PointTransaction.create({
      id: data.id,
      userId: data.userId,
      transactionType: data.transactionType,
      amount: data.amount,
      balanceAfter: data.balanceAfter,
      relatedOrderId: data.relatedOrderId,
      description: data.description,
      createdAt: data.createdAt,
    });
  }

  /**
   * 단일 엔티티 조회 오버라이드
   */
  override async findById(id: number): Promise<PointTransaction | null> {
    const entity = await super.findById(id);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 조건에 맞는 단일 엔티티 조회 오버라이드
   */
  override async findOne(
    predicate: (entity: PointTransaction) => boolean,
  ): Promise<PointTransaction | null> {
    const entity = await super.findOne(predicate);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 모든 엔티티 조회 오버라이드
   */
  override async findAll(): Promise<PointTransaction[]> {
    const entities = await super.findAll();
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 조건에 맞는 엔티티 목록 조회 오버라이드
   */
  override async findMany(
    predicate: (entity: PointTransaction) => boolean,
  ): Promise<PointTransaction[]> {
    const entities = await super.findMany(predicate);
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 엔티티 수정 오버라이드
   */
  override async update(
    id: number,
    entityData: Partial<PointTransaction>,
  ): Promise<PointTransaction | null> {
    const entity = await super.update(id, entityData);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 사용자 ID로 거래 내역 조회
   */
  async findByUserId(userId: number): Promise<PointTransaction[]> {
    const transactions = await this.findMany((t) => t.userId === userId);
    // 최신 거래가 먼저 표시 (createdAt 내림차순)
    return transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * 사용자 ID와 거래 유형으로 거래 내역 조회
   */
  async findByUserIdAndType(
    userId: number,
    transactionType: 'CHARGE' | 'USE' | 'REFUND',
  ): Promise<PointTransaction[]> {
    const transactions = await this.findMany(
      (t) => t.userId === userId && t.transactionType === transactionType,
    );
    return transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * 사용자 ID와 날짜 범위로 거래 내역 조회
   */
  async findByUserIdAndDateRange(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<PointTransaction[]> {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const transactions = await this.findMany((t) => {
      const createdAt = new Date(t.createdAt).getTime();
      return t.userId === userId && createdAt >= start && createdAt <= end;
    });

    return transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * 주문 ID로 거래 내역 조회
   */
  async findByOrderId(orderId: number): Promise<PointTransaction[]> {
    return await this.findMany((t) => t.relatedOrderId === orderId);
  }

  /**
   * 페이지네이션을 지원하는 거래 내역 조회
   */
  async findWithPagination(params: {
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
  }> {
    let transactions = await this.findMany((t) => t.userId === params.userId);

    // 거래 유형 필터
    if (params.transactionType) {
      transactions = transactions.filter(
        (t) => t.transactionType === params.transactionType,
      );
    }

    // 날짜 범위 필터
    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate).getTime();
      const end = new Date(params.endDate).getTime();
      transactions = transactions.filter((t) => {
        const createdAt = new Date(t.createdAt).getTime();
        return createdAt >= start && createdAt <= end;
      });
    }

    // 최신 거래가 먼저 표시 (createdAt 내림차순)
    transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const totalCount = transactions.length;
    const totalPages = Math.ceil(totalCount / params.size);
    const startIndex = (params.page - 1) * params.size;
    const endIndex = startIndex + params.size;

    return {
      transactions: transactions.slice(startIndex, endIndex),
      totalCount,
      currentPage: params.page,
      totalPages,
    };
  }

  /**
   * 사용자의 최근 거래 조회
   */
  async findLatestByUserId(
    userId: number,
    limit: number,
  ): Promise<PointTransaction[]> {
    const transactions = await this.findByUserId(userId);
    return transactions.slice(0, limit);
  }
}
