export interface LockOptions {
  /** 락 TTL (밀리초, 기본: 3000ms) */
  ttl?: number;

  /** 전체 대기 타임아웃 (밀리초, 기본: 10000ms) */
  totalTimeout?: number;

  /** Redlock drift factor (기본: 0.01) */
  driftFactor?: number;

  /** Redlock 재시도 횟수 (기본: 10) */
  retryCount?: number;

  /** Redlock 재시도 간격 (밀리초, 기본: 200ms) */
  retryDelay?: number;

  /** Redlock 재시도 지터 (밀리초, 기본: 200ms) */
  retryJitter?: number;
}

export interface LockMetadata {
  lockKey: string;
  acquiredAt: Date;
  ttl: number;
}
