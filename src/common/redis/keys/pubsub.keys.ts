import { RedisKeyBuilder } from './redis-key.builder';

/**
 * Pub/Sub Channel Prefix
 */
const PREFIX = 'pubsub';

/**
 * Lock 해제 알림 채널
 */
export const LockPubSubChannels = {
  /**
   * 쿠폰 발급 락 해제 채널
   * @example pubsub:lock:coupon:issue:123
   */
  couponIssue: (couponId: number): string =>
    RedisKeyBuilder.build(PREFIX, 'lock', 'coupon', 'issue', couponId),

  /**
   * 일반 락 해제 채널 (락 키 기반)
   * 락 키를 기반으로 해제 채널 생성
   * @example pubsub:lock:release:lock-coupon-issue-123
   */
  fromLockKey: (lockKey: string): string =>
    RedisKeyBuilder.build(
      PREFIX,
      'lock',
      'release',
      lockKey.replace(/:/g, '-'),
    ),
} as const;
