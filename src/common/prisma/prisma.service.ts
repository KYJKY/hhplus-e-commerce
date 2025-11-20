import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';

/**
 * Prisma Service
 *
 * PrismaClient를 래핑하여 NestJS 라이프사이클에 통합
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({} as any);
  }

  /**
   * 모듈 초기화 시 DB 연결
   */
  async onModuleInit() {
    try {
      await this.$connect();
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
      await this.$disconnect();
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Failed to disconnect from database', error);
    }
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
    return this.$transaction(fn);
  }
}
