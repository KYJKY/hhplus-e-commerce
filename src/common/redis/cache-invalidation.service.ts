import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async invalidateProduct(productId: number): Promise<void> {
    const keys = [
      `cache:product:${productId}`,
      `cache:product-options:${productId}`,
    ];

    for (const key of keys) {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache invalidated: ${key}`);
    }
  }

  async invalidateUser(userId: number): Promise<void> {
    const key = `cache:user:${userId}`;
    await this.cacheManager.del(key);
    this.logger.debug(`Cache invalidated: ${key}`);
  }

  async invalidatePopularProducts(): Promise<void> {
    const key = 'cache:popular-products';
    await this.cacheManager.del(key);
    this.logger.debug(`Cache invalidated: ${key}`);
  }
}
