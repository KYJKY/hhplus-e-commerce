import { Injectable } from '@nestjs/common';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { PrismaService } from 'src/common/prisma';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: bigint;
    order_id: bigint;
    user_id: bigint;
    payment_method: string;
    payment_status: string;
    paid_amount: any; // Decimal
    failure_reason: string | null;
    paid_at: Date;
    created_at: Date;
    updated_at: Date;
  }): Payment {
    return Payment.create({
      id: Number(data.id),
      orderId: Number(data.order_id),
      userId: Number(data.user_id),
      paymentMethod: data.payment_method as 'POINT',
      paymentStatus: data.payment_status as 'SUCCESS' | 'FAILED' | 'CANCELLED',
      paidAmount: Number(data.paid_amount),
      failureReason: data.failure_reason,
      paidAt: data.paid_at.toISOString(),
      createdAt: data.created_at.toISOString(),
      updatedAt: data.updated_at.toISOString(),
    });
  }

  async findById(id: number): Promise<Payment | null> {
    const payment = await this.prisma.payments.findUnique({
      where: { id: BigInt(id) },
    });
    return payment ? this.toDomain(payment) : null;
  }

  async findByOrderId(orderId: number): Promise<Payment | null> {
    const payment = await this.prisma.payments.findUnique({
      where: { order_id: BigInt(orderId) },
    });
    return payment ? this.toDomain(payment) : null;
  }

  async findByUserId(userId: number): Promise<Payment[]> {
    const payments = await this.prisma.payments.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
    });
    return payments.map((p) => this.toDomain(p));
  }

  async findByUserIdAndStatus(
    userId: number,
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED',
  ): Promise<Payment[]> {
    const payments = await this.prisma.payments.findMany({
      where: {
        user_id: BigInt(userId),
        payment_status: status,
      },
      orderBy: { created_at: 'desc' },
    });
    return payments.map((p) => this.toDomain(p));
  }

  async findByIdAndUserId(
    paymentId: number,
    userId: number,
  ): Promise<Payment | null> {
    const payment = await this.prisma.payments.findFirst({
      where: {
        id: BigInt(paymentId),
        user_id: BigInt(userId),
      },
    });
    return payment ? this.toDomain(payment) : null;
  }

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
    const { userId, status, page, size } = params;
    const skip = (page - 1) * size;

    const where: any = { user_id: BigInt(userId) };
    if (status) {
      where.payment_status = status;
    }

    const [payments, totalCount] = await Promise.all([
      this.prisma.payments.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: size,
      }),
      this.prisma.payments.count({ where }),
    ]);

    return {
      payments: payments.map((p) => this.toDomain(p)),
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / size),
    };
  }

  async getPaymentStatistics(userId: number): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
    lastPaymentAt: string | null;
  }> {
    const payments = await this.prisma.payments.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
    });

    const totalPayments = payments.length;
    const successfulPayments = payments.filter(
      (p) => p.payment_status === 'SUCCESS',
    ).length;
    const failedPayments = payments.filter(
      (p) => p.payment_status === 'FAILED',
    ).length;
    const totalAmount = payments
      .filter((p) => p.payment_status === 'SUCCESS')
      .reduce((sum, p) => sum + Number(p.paid_amount), 0);
    const averagePaymentAmount =
      successfulPayments > 0 ? totalAmount / successfulPayments : 0;
    const lastPaymentAt =
      payments.length > 0 ? payments[0].paid_at.toISOString() : null;

    return {
      totalPayments,
      totalAmount,
      successfulPayments,
      failedPayments,
      averagePaymentAmount,
      lastPaymentAt,
    };
  }

  async findOne(
    predicate: (entity: Payment) => boolean,
  ): Promise<Payment | null> {
    const payments = await this.prisma.payments.findMany();
    const payment = payments.find((p) => predicate(this.toDomain(p)));
    return payment ? this.toDomain(payment) : null;
  }

  async findAll(): Promise<Payment[]> {
    const payments = await this.prisma.payments.findMany();
    return payments.map((p) => this.toDomain(p));
  }

  async findMany(predicate: (entity: Payment) => boolean): Promise<Payment[]> {
    const payments = await this.prisma.payments.findMany();
    return payments
      .filter((p) => predicate(this.toDomain(p)))
      .map((p) => this.toDomain(p));
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.payments.count({
      where: { id: BigInt(id) },
    });
    return count > 0;
  }

  async create(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const created = await this.prisma.payments.create({
      data: {
        order_id: BigInt(payment.orderId),
        user_id: BigInt(payment.userId),
        payment_method: payment.paymentMethod,
        payment_status: payment.paymentStatus,
        paid_amount: payment.paidAmount,
        failure_reason: payment.failureReason,
        paid_at: payment.paidAt ? new Date(payment.paidAt) : new Date(),
        created_at: payment.createdAt
          ? new Date(payment.createdAt)
          : new Date(),
        updated_at: payment.updatedAt
          ? new Date(payment.updatedAt)
          : new Date(),
      },
    });
    return this.toDomain(created);
  }

  async update(id: number, updates: Partial<Payment>): Promise<Payment | null> {
    const updateData: any = { updated_at: new Date() };

    if (updates.paymentStatus !== undefined)
      updateData.payment_status = updates.paymentStatus;
    if (updates.failureReason !== undefined)
      updateData.failure_reason = updates.failureReason;

    const updated = await this.prisma.payments.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.payments.delete({
        where: { id: BigInt(id) },
      });
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.prisma.payments.deleteMany();
      return true;
    } catch {
      return false;
    }
  }

  async count(predicate?: (entity: Payment) => boolean): Promise<number> {
    if (predicate) {
      const payments = await this.prisma.payments.findMany();
      return payments.filter((p) => predicate(this.toDomain(p))).length;
    }
    return await this.prisma.payments.count();
  }
}
