import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * 캐싱 헬퍼 서비스
 *
 * "캐시 조회 → DB 조회 → 캐시 저장" 패턴을 캡슐화하여
 * 도메인 서비스에서 캐싱 로직을 간결하게 작성할 수 있도록 지원
 */
@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 캐시 조회 후 없으면 fetcher 함수 실행하고 캐시 저장
   *
   * @param cacheKey - 캐시 키
   * @param fetcher - 캐시 미스 시 실행할 DB 조회 함수
   * @param ttl - TTL (milliseconds), 기본값: 30분
   * @returns 캐시된 데이터 또는 fetcher 실행 결과
   *
   * @example
   * ```typescript
   * return await this.cacheService.getOrSet(
   *   `product:detail:${productId}`,
   *   async () => {
   *     // DB 조회 로직
   *     return await this.fetchProductFromDB(productId);
   *   },
   *   30 * 60 * 1000 // 30분
   * );
   * ```
   */
  async getOrSet<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number = 30 * 60 * 1000,
  ): Promise<T> {
    // 1. 캐시 조회
    const cached = await this.redisService.get<T>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // 2. 캐시 미스 - fetcher 실행
    const result = await fetcher();

    // 3. 캐시에 저장
    await this.redisService.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * 여러 캐시 키를 한 번에 삭제
   *
   * @param keys - 삭제할 캐시 키 배열
   *
   * @example
   * ```typescript
   * await this.cacheService.deleteMany([
   *   `product:detail:${productId}`,
   *   `product:options:${productId}`,
   * ]);
   * ```
   */
  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.redisService.del(key)));
  }

  /**
   * 단일 캐시 키 삭제
   *
   * @param key - 삭제할 캐시 키
   */
  async delete(key: string): Promise<void> {
    await this.redisService.del(key);
  }

  /**
   * 캐시 키 생성 헬퍼
   *
   * @param parts - 캐시 키 구성 요소들
   * @returns 생성된 캐시 키 (콜론으로 구분)
   *
   * @example
   * ```typescript
   * const key = this.cacheService.buildKey('product', 'detail', productId);
   * // 결과: "product:detail:123"
   * ```
   */
  buildKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }
}
