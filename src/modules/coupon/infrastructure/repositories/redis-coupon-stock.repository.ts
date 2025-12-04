import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import {
  ICouponStockRepository,
  CouponIssuanceResult,
  CouponMetadata,
} from '../../domain/repositories/coupon-stock.repository.interface';
import { CouponStockKeys, RedisTTL } from 'src/common/redis';

@Injectable()
export class RedisCouponStockRepository
  implements ICouponStockRepository, OnModuleDestroy
{
  private readonly logger = new Logger(RedisCouponStockRepository.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    const clientConfig: RedisOptions = {
      host,
      port,
      password: password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    this.redis = new Redis(clientConfig);

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected for coupon stock');
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down RedisCouponStockRepository...');
    await this.redis.quit();
  }

  async tryIssue(
    userId: number,
    couponId: number,
  ): Promise<CouponIssuanceResult> {
    const stockKey = CouponStockKeys.stock(couponId);
    const usersKey = CouponStockKeys.issuedUsers(couponId);

    // 1. 중복 발급 확인
    const alreadyIssued = await this.redis.sismember(usersKey, String(userId));
    if (alreadyIssued === 1) {
      this.logger.debug(
        `User ${userId} already issued coupon ${couponId}`,
      );
      return { status: 'ALREADY_ISSUED' };
    }

    // 2. 재고 확인
    const currentStock = await this.redis.get(stockKey);
    if (currentStock === null) {
      this.logger.warn(`Stock data not found for coupon ${couponId}`);
      return { status: 'COUPON_NOT_FOUND' };
    }

    const stockValue = parseInt(currentStock, 10);
    if (stockValue <= 0) {
      this.logger.debug(`Coupon ${couponId} out of stock`);
      return { status: 'OUT_OF_STOCK', remainingStock: 0 };
    }

    // 3. 재고 차감 (DECR은 원자적)
    const newStock = await this.redis.decr(stockKey);

    // 4. 차감 후 재고가 음수면 롤백
    if (newStock < 0) {
      await this.redis.incr(stockKey);
      this.logger.debug(`Coupon ${couponId} out of stock (race condition)`);
      return { status: 'OUT_OF_STOCK', remainingStock: 0 };
    }

    // 5. 발급 사용자 등록
    await this.redis.sadd(usersKey, String(userId));

    this.logger.debug(
      `Coupon ${couponId} issued to user ${userId}, remaining: ${newStock}`,
    );

    return { status: 'SUCCESS', remainingStock: newStock };
  }

  async rollbackIssuance(userId: number, couponId: number): Promise<void> {
    const stockKey = CouponStockKeys.stock(couponId);
    const usersKey = CouponStockKeys.issuedUsers(couponId);

    const pipeline = this.redis.pipeline();
    pipeline.incr(stockKey);
    pipeline.srem(usersKey, String(userId));
    await pipeline.exec();

    this.logger.warn(
      `Rolled back coupon ${couponId} issuance for user ${userId}`,
    );
  }

  async syncStock(
    couponId: number,
    remainingStock: number,
    ttlSeconds?: number,
  ): Promise<void> {
    const stockKey = CouponStockKeys.stock(couponId);
    const ttl = ttlSeconds ?? RedisTTL.COUPON.STOCK_DATA;

    await this.redis.setex(stockKey, ttl, remainingStock);

    this.logger.debug(
      `Synced stock for coupon ${couponId}: ${remainingStock} (TTL: ${ttl}s)`,
    );
  }

  async syncIssuedUsers(
    couponId: number,
    userIds: number[],
    ttlSeconds?: number,
  ): Promise<void> {
    const usersKey = CouponStockKeys.issuedUsers(couponId);
    const ttl = ttlSeconds ?? RedisTTL.COUPON.STOCK_DATA;

    // 기존 데이터 삭제 후 새로 추가
    await this.redis.del(usersKey);

    if (userIds.length > 0) {
      const pipeline = this.redis.pipeline();
      pipeline.sadd(usersKey, ...userIds.map(String));
      pipeline.expire(usersKey, ttl);
      await pipeline.exec();
    }

    this.logger.debug(
      `Synced issued users for coupon ${couponId}: ${userIds.length} users (TTL: ${ttl}s)`,
    );
  }

  async cacheMetadata(
    couponId: number,
    metadata: CouponMetadata,
    ttlSeconds?: number,
  ): Promise<void> {
    const metaKey = CouponStockKeys.meta(couponId);
    const ttl = ttlSeconds ?? RedisTTL.COUPON.META;

    const pipeline = this.redis.pipeline();
    pipeline.hset(metaKey, {
      isActive: metadata.isActive ? '1' : '0',
      validFrom: metadata.validFrom,
      validUntil: metadata.validUntil,
      issueLimit: String(metadata.issueLimit),
    });
    pipeline.expire(metaKey, ttl);
    await pipeline.exec();

    this.logger.debug(`Cached metadata for coupon ${couponId} (TTL: ${ttl}s)`);
  }

  async getMetadata(couponId: number): Promise<CouponMetadata | null> {
    const metaKey = CouponStockKeys.meta(couponId);
    const data = await this.redis.hgetall(metaKey);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      isActive: data.isActive === '1',
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      issueLimit: parseInt(data.issueLimit, 10),
    };
  }

  async getRemainingStock(couponId: number): Promise<number | null> {
    const stockKey = CouponStockKeys.stock(couponId);
    const stock = await this.redis.get(stockKey);

    if (stock === null) {
      return null;
    }

    return parseInt(stock, 10);
  }

  async hasUserIssued(userId: number, couponId: number): Promise<boolean> {
    const usersKey = CouponStockKeys.issuedUsers(couponId);
    const result = await this.redis.sismember(usersKey, String(userId));
    return result === 1;
  }

  async removeCouponData(couponId: number): Promise<void> {
    const stockKey = CouponStockKeys.stock(couponId);
    const usersKey = CouponStockKeys.issuedUsers(couponId);
    const metaKey = CouponStockKeys.meta(couponId);

    await this.redis.del(stockKey, usersKey, metaKey);

    this.logger.debug(`Removed all Redis data for coupon ${couponId}`);
  }

  async exists(couponId: number): Promise<boolean> {
    const stockKey = CouponStockKeys.stock(couponId);
    const result = await this.redis.exists(stockKey);
    return result === 1;
  }
}
