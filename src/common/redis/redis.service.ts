import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 캐시에서 값을 조회합니다.
   * @param key 캐시 키
   * @returns 캐시된 값 또는 undefined
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * 캐시에 값을 저장합니다.
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl TTL(Time To Live) in milliseconds (선택 사항)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * 캐시에서 값을 삭제합니다.
   * @param key 캐시 키
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * 캐시 키 생성 헬퍼 메서드
   * @param prefix 접두사
   * @param identifier 식별자
   * @returns 생성된 캐시 키
   */
  generateKey(prefix: string, identifier: string | number): string {
    return `${prefix}:${identifier}`;
  }
}
