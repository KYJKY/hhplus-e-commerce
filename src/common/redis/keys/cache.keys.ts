import { RedisKeyBuilder } from './redis-key.builder';

/**
 * Cache Key Prefix
 */
const PREFIX = 'cache';

/**
 * Product 도메인 캐시 키
 */
export const ProductCacheKeys = {
  /**
   * 상품 상세 캐시 키
   * @example cache:product:detail:123
   */
  detail: (productId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'product', 'detail', productId),

  /**
   * 상품 옵션 목록 캐시 키
   * @example cache:product:options:123
   */
  options: (productId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'product', 'options', productId),

  /**
   * 옵션 상세 캐시 키
   * @example cache:product:option:123:456
   */
  option: (productId: number, optionId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'product', 'option', productId, optionId),

  /**
   * 상품 관련 모든 캐시 키 패턴 (무효화용)
   * @example cache:product:*:123*
   */
  allForProduct: (productId: number): string =>
    `${PREFIX}:product:*:${productId}*`,
} as const;

/**
 * Ranking 캐시 키 (캐싱된 랭킹 결과)
 */
export const RankingCacheKeys = {
  /**
   * 인기 상품 캐시 키
   * @example cache:ranking:popular:3
   */
  popularProducts: (days: number): string =>
    RedisKeyBuilder.build(PREFIX, 'ranking', 'popular', days),
} as const;
