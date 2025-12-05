import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { IProductRankingRepository } from '../../domain/repositories/product-ranking.repository.interface';
import {
  ProductRankingKeys,
  RankingCacheKeys,
  RankingTempKeys,
  RedisTTL,
} from 'src/common/redis';

@Injectable()
export class RedisProductRankingRepository
  implements IProductRankingRepository, OnModuleDestroy
{
  private readonly logger = new Logger(RedisProductRankingRepository.name);
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
      this.logger.log('Redis connected for product ranking');
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down RedisProductRankingRepository...');
    await this.redis.quit();
  }

  /**
   * 일별 키 생성
   * @example ranking:product:sales:2025-01-15
   */
  private getDailyKey(date: Date): string {
    return ProductRankingKeys.dailySales(date);
  }

  /**
   * 캐시 키 생성
   * @example cache:ranking:popular:3
   */
  private getCacheKey(days: number): string {
    return RankingCacheKeys.popularProducts(days);
  }

  /**
   * 일별 키 목록 생성
   */
  private generateDailyKeys(days: number): string[] {
    return ProductRankingKeys.dailySalesRange(days);
  }

  async incrementScore(
    productId: number,
    quantity: number,
    date: Date = new Date(),
  ): Promise<number> {
    const key = this.getDailyKey(date);

    // 파이프라인으로 ZINCRBY + EXPIRE 실행
    const pipeline = this.redis.pipeline();
    pipeline.zincrby(key, quantity, String(productId));
    pipeline.expire(key, RedisTTL.RANKING.DAILY_SALES);

    const results = await pipeline.exec();
    const newScore = results?.[0]?.[1] as string;

    this.logger.debug(
      `Incremented score for product ${productId}: +${quantity}, new score: ${newScore}`,
    );

    return parseFloat(newScore) || 0;
  }

  async incrementScoreBatch(
    items: Array<{ productId: number; quantity: number }>,
    date: Date = new Date(),
  ): Promise<void> {
    if (items.length === 0) return;

    const key = this.getDailyKey(date);
    const pipeline = this.redis.pipeline();

    // 각 상품에 대해 ZINCRBY 명령 추가
    for (const item of items) {
      pipeline.zincrby(key, item.quantity, String(item.productId));
    }

    // TTL 설정
    pipeline.expire(key, RedisTTL.RANKING.DAILY_SALES);

    await pipeline.exec();

    this.logger.debug(
      `Batch incremented scores for ${items.length} products on ${key}`,
    );
  }

  async getTopProducts(
    days: number = 3,
    limit: number = 5,
  ): Promise<Array<{ productId: number; totalSales: number }>> {
    // 1. 캐시 확인
    const cacheKey = this.getCacheKey(days);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for top products (days=${days})`);
      return JSON.parse(cached);
    }

    // 2. 일별 키 목록 생성
    const keys = this.generateDailyKeys(days);

    // 3. 존재하는 키만 필터링
    const existingKeys: string[] = [];
    for (const key of keys) {
      const exists = await this.redis.exists(key);
      if (exists) {
        existingKeys.push(key);
      }
    }

    // 존재하는 키가 없으면 빈 배열 반환
    if (existingKeys.length === 0) {
      this.logger.debug('No ranking data found for the specified period');
      return [];
    }

    // 4. 임시 키에 합산 (ZUNIONSTORE)
    const tempKey = RankingTempKeys.salesUnion();

    if (existingKeys.length === 1) {
      // 단일 키면 복사
      await this.redis.zunionstore(tempKey, 1, existingKeys[0]);
    } else {
      // 여러 키 합산
      await this.redis.zunionstore(tempKey, existingKeys.length, ...existingKeys);
    }

    // 5. 상위 N개 조회 (ZREVRANGE with WITHSCORES)
    const results = await this.redis.zrevrange(
      tempKey,
      0,
      limit - 1,
      'WITHSCORES',
    );

    // 6. 임시 키 삭제
    await this.redis.del(tempKey);

    // 7. 결과 파싱
    const rankings: Array<{ productId: number; totalSales: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      rankings.push({
        productId: parseInt(results[i], 10),
        totalSales: parseFloat(results[i + 1]),
      });
    }

    // 8. 캐시 저장 (결과가 있을 때만)
    if (rankings.length > 0) {
      const cacheTtlSeconds = Math.floor(
        RedisTTL.CACHE.POPULAR_PRODUCTS / 1000,
      );
      await this.redis.setex(cacheKey, cacheTtlSeconds, JSON.stringify(rankings));
      this.logger.debug(`Cached top products (days=${days}, count=${rankings.length})`);
    }

    return rankings;
  }

  async getDailyRanking(
    date: Date,
    limit: number,
  ): Promise<Array<{ productId: number; sales: number }>> {
    const key = this.getDailyKey(date);
    const results = await this.redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');

    const rankings: Array<{ productId: number; sales: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      rankings.push({
        productId: parseInt(results[i], 10),
        sales: parseFloat(results[i + 1]),
      });
    }

    return rankings;
  }

  async getProductRank(
    productId: number,
    days: number = 3,
  ): Promise<number | null> {
    // 일별 키 목록 생성
    const keys = this.generateDailyKeys(days);

    // 존재하는 키만 필터링
    const existingKeys: string[] = [];
    for (const key of keys) {
      const exists = await this.redis.exists(key);
      if (exists) {
        existingKeys.push(key);
      }
    }

    if (existingKeys.length === 0) {
      return null;
    }

    // 임시 키 생성
    const tempKey = RankingTempKeys.rankQuery();

    if (existingKeys.length === 1) {
      await this.redis.zunionstore(tempKey, 1, existingKeys[0]);
    } else {
      await this.redis.zunionstore(tempKey, existingKeys.length, ...existingKeys);
    }

    // ZREVRANK는 0-based 인덱스 반환
    const rank = await this.redis.zrevrank(tempKey, String(productId));

    await this.redis.del(tempKey);

    // 1-based로 변환
    return rank !== null ? rank + 1 : null;
  }
}
