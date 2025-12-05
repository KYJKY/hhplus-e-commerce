/**
 * 분산 락 설정
 *
 * Note: 락 키 및 Pub/Sub 채널은 src/common/redis/keys/ 에서 관리
 * - CouponLockKeys.issue(couponId) - 쿠폰 발급 락
 * - LockPubSubChannels.couponIssue(couponId) - 락 해제 알림 채널
 */
export const DISTRIBUTED_LOCK_CONFIG = {
  DEFAULT_TTL: 3000, // 3초
  DEFAULT_TOTAL_TIMEOUT: 10000, // 10초
  DEFAULT_RETRY_COUNT: 10,
  DEFAULT_RETRY_DELAY: 200, // 200ms
  DEFAULT_RETRY_JITTER: 200, // 200ms
  DEFAULT_DRIFT_FACTOR: 0.01,
  PUBSUB_WAIT_TIMEOUT: 2000, // 2초
} as const;
