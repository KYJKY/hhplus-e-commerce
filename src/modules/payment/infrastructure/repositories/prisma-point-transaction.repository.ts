import { Injectable } from '@nestjs/common';
import { IPointTransactionRepository } from '../../domain/repositories/point-transaction.repository.interface';
import { PointTransaction } from '../../domain/entities/point-transaction.entity';
import { PrismaService } from 'src/common/prisma';

@Injectable()
export class PrismaPointTransactionRepository
  implements IPointTransactionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: bigint;
    user_id: bigint;
    transaction_type: string;
    amount: any; // Decimal
    balance_after: any; // Decimal
    related_order_id: bigint | null;
    description: string | null;
    created_at: Date;
  }): PointTransaction {
    return PointTransaction.create({
      id: Number(data.id),
      userId: Number(data.user_id),
      transactionType: data.transaction_type as 'CHARGE' | 'USE' | 'REFUND',
      amount: Number(data.amount),
      balanceAfter: Number(data.balance_after),
      relatedOrderId: data.related_order_id
        ? Number(data.related_order_id)
        : null,
      description: data.description,
      createdAt: data.created_at.toISOString(),
    });
  }

  async findById(id: number): Promise<PointTransaction | null> {
    const transaction = await this.prisma.point_transactions.findUnique({
      where: { id: BigInt(id) },
    });
    return transaction ? this.toDomain(transaction) : null;
  }

  async findByUserId(userId: number): Promise<PointTransaction[]> {
    const transactions = await this.prisma.point_transactions.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
    });
    return transactions.map((t) => this.toDomain(t));
  }

  async findByUserIdAndType(
    userId: number,
    transactionType: 'CHARGE' | 'USE' | 'REFUND',
  ): Promise<PointTransaction[]> {
    const transactions = await this.prisma.point_transactions.findMany({
      where: {
        user_id: BigInt(userId),
        transaction_type: transactionType,
      },
      orderBy: { created_at: 'desc' },
    });
    return transactions.map((t) => this.toDomain(t));
  }

  async findByUserIdAndDateRange(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<PointTransaction[]> {
    const transactions = await this.prisma.point_transactions.findMany({
      where: {
        user_id: BigInt(userId),
        created_at: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return transactions.map((t) => this.toDomain(t));
  }

  async findByOrderId(orderId: number): Promise<PointTransaction[]> {
    const transactions = await this.prisma.point_transactions.findMany({
      where: { related_order_id: BigInt(orderId) },
      orderBy: { created_at: 'desc' },
    });
    return transactions.map((t) => this.toDomain(t));
  }

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
    const { userId, transactionType, startDate, endDate, page, size } = params;
    const skip = (page - 1) * size;

    const where: any = { user_id: BigInt(userId) };
    if (transactionType) {
      where.transaction_type = transactionType;
    }
    if (startDate && endDate) {
      where.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [transactions, totalCount] = await Promise.all([
      this.prisma.point_transactions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: size,
      }),
      this.prisma.point_transactions.count({ where }),
    ]);

    return {
      transactions: transactions.map((t) => this.toDomain(t)),
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / size),
    };
  }

  async findLatestByUserId(
    userId: number,
    limit: number,
  ): Promise<PointTransaction[]> {
    const transactions = await this.prisma.point_transactions.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    return transactions.map((t) => this.toDomain(t));
  }

  async findOne(
    predicate: (entity: PointTransaction) => boolean,
  ): Promise<PointTransaction | null> {
    const transactions = await this.prisma.point_transactions.findMany();
    const transaction = transactions.find((t) => predicate(this.toDomain(t)));
    return transaction ? this.toDomain(transaction) : null;
  }

  async findAll(): Promise<PointTransaction[]> {
    const transactions = await this.prisma.point_transactions.findMany();
    return transactions.map((t) => this.toDomain(t));
  }

  async findMany(
    predicate: (entity: PointTransaction) => boolean,
  ): Promise<PointTransaction[]> {
    const transactions = await this.prisma.point_transactions.findMany();
    return transactions
      .filter((t) => predicate(this.toDomain(t)))
      .map((t) => this.toDomain(t));
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.point_transactions.count({
      where: { id: BigInt(id) },
    });
    return count > 0;
  }

  async create(
    transaction: Omit<PointTransaction, 'id'>,
  ): Promise<PointTransaction> {
    const created = await this.prisma.point_transactions.create({
      data: {
        user_id: BigInt(transaction.userId),
        transaction_type: transaction.transactionType,
        amount: transaction.amount,
        balance_after: transaction.balanceAfter,
        related_order_id: transaction.relatedOrderId
          ? BigInt(transaction.relatedOrderId)
          : null,
        description: transaction.description,
        created_at: transaction.createdAt
          ? new Date(transaction.createdAt)
          : new Date(),
      },
    });
    return this.toDomain(created);
  }

  async update(
    id: number,
    updates: Partial<PointTransaction>,
  ): Promise<PointTransaction | null> {
    // PointTransaction은 보통 수정하지 않지만 인터페이스 구현을 위해 포함
    const updateData: any = {};

    if (updates.description !== undefined)
      updateData.description = updates.description;

    const updated = await this.prisma.point_transactions.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.point_transactions.delete({
        where: { id: BigInt(id) },
      });
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.prisma.point_transactions.deleteMany();
      return true;
    } catch {
      return false;
    }
  }

  async count(
    predicate?: (entity: PointTransaction) => boolean,
  ): Promise<number> {
    if (predicate) {
      const transactions = await this.prisma.point_transactions.findMany();
      return transactions.filter((t) => predicate(this.toDomain(t))).length;
    }
    return await this.prisma.point_transactions.count();
  }
}
