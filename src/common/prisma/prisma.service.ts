import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Service
 *
 * PrismaClient를 래핑하여 NestJS 라이프사이클에 통합
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 모듈 초기화 시 DB 연결
   */
  async onModuleInit() {
    try {
      await this.prisma.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * 모듈 종료 시 DB 연결 해제
   */
  async onModuleDestroy() {
    try {
      await this.prisma.$disconnect();
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Failed to disconnect from database', error);
    }
  }

  /**
   * PrismaClient의 모든 메서드에 접근할 수 있도록 getter 제공
   */
  get client() {
    return this.prisma;
  }

  // 자주 사용하는 메서드들을 직접 노출
  get users() {
    return this.prisma.users;
  }

  get products() {
    return this.prisma.products;
  }

  get product_options() {
    return this.prisma.product_options;
  }

  get cart_items() {
    return this.prisma.cart_items;
  }

  get orders() {
    return this.prisma.orders;
  }

  get order_items() {
    return this.prisma.order_items;
  }

  get payments() {
    return this.prisma.payments;
  }

  get point_transactions() {
    return this.prisma.point_transactions;
  }

  get coupons() {
    return this.prisma.coupons;
  }

  get user_coupons() {
    return this.prisma.user_coupons;
  }

  get user_address() {
    return this.prisma.user_address;
  }

  get categories() {
    return this.prisma.categories;
  }

  get product_categories() {
    return this.prisma.product_categories;
  }

  get data_transmissions() {
    return this.prisma.data_transmissions;
  }

  /**
   * $transaction 직접 노출
   */
  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }

  /**
   * 트랜잭션 헬퍼
   *
   * @example
   * await prismaService.transaction(async (tx) => {
   *   await tx.users.update(...);
   *   await tx.orders.create(...);
   * });
   */
  async transaction<T>(
    fn: (
      tx: Omit<
        PrismaClient,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
      >,
    ) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  /**
   * Raw query 실행
   */
  $queryRaw<T = unknown>(...args: Parameters<PrismaClient['$queryRaw']>) {
    return this.prisma.$queryRaw<T>(...args);
  }

  /**
   * Raw execute 실행
   */
  $executeRaw(...args: Parameters<PrismaClient['$executeRaw']>) {
    return this.prisma.$executeRaw(...args);
  }
}
