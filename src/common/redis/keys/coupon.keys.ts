import { RedisKeyBuilder } from './redis-key.builder';

/**
 * Coupon Stock Key Prefix
 */
const PREFIX = 'coupon';

/**
 * 쿠폰 재고 관련 Redis 키
 */
export const CouponStockKeys = {
  /**
   * 쿠폰 남은 재고 수량
   * @example coupon:stock:123
   */
  stock: (couponId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'stock', couponId),

  /**
   * 쿠폰 발급받은 사용자 Set
   * @example coupon:issued_users:123
   */
  issuedUsers: (couponId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'issued_users', couponId),

  /**
   * 쿠폰 메타데이터 (Hash)
   * @example coupon:meta:123
   */
  meta: (couponId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'meta', couponId),
} as const;
