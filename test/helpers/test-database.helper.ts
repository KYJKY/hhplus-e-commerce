import { PrismaClient } from '@prisma/client';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { execSync } from 'child_process';

/**
 * TestContainer 기반 테스트 데이터베이스 헬퍼
 *
 * 고전파(Classical) 테스트를 위한 실제 MySQL + Redis 환경 제공
 * - Mock 없이 실제 Prisma + MySQL 사용
 * - Redis TestContainer로 실제 분산락 테스트
 * - 각 테스트 스위트마다 독립적인 컨테이너
 * - 자동 스키마 마이그레이션
 */
export class TestDatabaseHelper {
  private static mysqlContainer: StartedMySqlContainer | null = null;
  private static redisContainer: StartedTestContainer | null = null;
  private static prisma: PrismaClient | null = null;
  private static redisHost: string = 'localhost';
  private static redisPort: number = 6379;

  /**
   * MySQL + Redis TestContainer 시작 및 Prisma Client 초기화
   */
  static async setup(): Promise<PrismaClient> {
    // Redis Container 시작 (먼저 시작)
    this.redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
      .withReuse() // 컨테이너 재사용 (성능 향상)
      .start();

    this.redisHost = this.redisContainer.getHost();
    this.redisPort = this.redisContainer.getMappedPort(6379);

    // MySQL Container 시작
    this.mysqlContainer = await new MySqlContainer('mysql:8.0')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withRootPassword('test_password')
      .withReuse() // 컨테이너 재사용 (성능 향상)
      .start();

    const connectionString = this.mysqlContainer.getConnectionUri();

    // Prisma Client 초기화
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
    });

    await this.prisma.$connect();

    // Prisma 스키마 마이그레이션 적용
    await this.runMigrations(connectionString);

    return this.prisma;
  }

  /**
   * Prisma 스키마 동기화 (db push 사용)
   * - migration 파일 없이 스키마를 직접 DB에 적용
   * - Database-First 프로젝트이므로 db push 사용
   */
  private static async runMigrations(databaseUrl: string): Promise<void> {
    try {
      execSync('npx prisma db push --skip-generate', {
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('Schema push failed:', error);
      throw error;
    }
  }

  /**
   * 테스트 데이터 초기화 (각 테스트 전)
   */
  static async cleanup(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized');
    }

    // 모든 테이블 데이터 삭제 (순서 중요: 외래키 제약 고려)
    await this.prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

    // 존재하는 테이블만 삭제 시도
    // 자식 테이블부터 삭제 (외래키 제약 고려)
    const tables = [
      'order_items',
      'cart_items',
      'product_options',
      'product_categories',
      'user_coupons',
      'data_transmissions',
      'payments',
      'point_transactions',
      'orders',
      'products',
      'categories',
      'coupons',
      'users',
    ];

    for (const table of tables) {
      try {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table}`);
      } catch (e) {
        // 테이블이 없으면 무시
      }
    }

    await this.prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;

    // Redis 데이터 초기화
    await this.cleanupRedis();
  }

  /**
   * Redis 데이터 초기화
   */
  private static async cleanupRedis(): Promise<void> {
    if (!this.redisContainer) {
      return;
    }

    try {
      const Redis = require('ioredis');
      const redis = new Redis({
        host: this.redisHost,
        port: this.redisPort,
      });

      await redis.flushall();
      await redis.quit();
    } catch (error) {
      // Redis cleanup 실패는 무시 (다음 테스트에 영향 최소화)
      console.warn('Redis cleanup failed:', error);
    }
  }

  /**
   * TestContainer 종료 및 리소스 정리
   */
  static async teardown(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }

    if (this.mysqlContainer) {
      await this.mysqlContainer.stop();
      this.mysqlContainer = null;
    }

    if (this.redisContainer) {
      await this.redisContainer.stop();
      this.redisContainer = null;
    }
  }

  /**
   * Redis 연결 정보 반환
   */
  static getRedisConfig(): { host: string; port: number } {
    return {
      host: this.redisHost,
      port: this.redisPort,
    };
  }

  /**
   * Prisma Client 인스턴스 반환
   */
  static getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized. Call setup() first.');
    }
    return this.prisma;
  }

  /**
   * 트랜잭션 헬퍼 (테스트 격리)
   */
  static async withTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
  ): Promise<T> {
    const prisma = this.getPrisma();
    return await prisma.$transaction(async (tx) => {
      return await fn(tx as PrismaClient);
    });
  }
}
