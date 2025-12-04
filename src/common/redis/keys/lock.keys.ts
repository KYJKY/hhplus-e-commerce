import { RedisKeyBuilder } from './redis-key.builder';

/**
 * Lock Key Prefix
 */
const PREFIX = 'lock';

/**
 * Coupon 도메인 분산 락 키
 */
export const CouponLockKeys = {
  /**
   * 쿠폰 발급 락 키
   * @example lock:coupon:issue:123
   */
  issue: (couponId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'coupon', 'issue', couponId),
} as const;

/**
 * Order 도메인 분산 락 키 (향후 확장)
 */
export const OrderLockKeys = {
  /**
   * 주문 처리 락 키
   * @example lock:order:process:123
   */
  process: (orderId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'order', 'process', orderId),
} as const;

/**
 * Product 도메인 분산 락 키 (향후 확장)
 */
export const ProductLockKeys = {
  /**
   * 재고 차감 락 키
   * @example lock:product:stock:123
   */
  stock: (optionId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'product', 'stock', optionId),
} as const;
