export const DISTRIBUTED_LOCK_CONFIG = {
  DEFAULT_TTL: 3000, // 3초
  DEFAULT_TOTAL_TIMEOUT: 10000, // 10초
  DEFAULT_RETRY_COUNT: 10,
  DEFAULT_RETRY_DELAY: 200, // 200ms
  DEFAULT_RETRY_JITTER: 200, // 200ms
  DEFAULT_DRIFT_FACTOR: 0.01,
  PUBSUB_WAIT_TIMEOUT: 2000, // 2초
} as const;

export const LOCK_KEY_PREFIX = {
  COUPON_ISSUE: 'lock:coupon:{id}:issue',
  RELEASE_CHANNEL: 'lock:release:coupon:{id}:issue',
} as const;
