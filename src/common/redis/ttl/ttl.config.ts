/**
 * Redis TTL 설정
 *
 * 단위 규칙:
 * - CACHE, LOCK: 밀리초 (ms) - NestJS Cache Manager 호환
 * - RANKING, TEMP: 초 (sec) - Redis EXPIRE 명령어 호환
 */
export const RedisTTL = {
  /**
   * 캐싱 TTL (밀리초)
   */
  CACHE: {
    /** 상품 상세 캐시 (30분) */
    PRODUCT_DETAIL: 30 * 60 * 1000,
    /** 상품 옵션 캐시 (30분) */
    PRODUCT_OPTIONS: 30 * 60 * 1000,
    /** 인기 상품 랭킹 캐시 (5분) */
    POPULAR_PRODUCTS: 5 * 60 * 1000,
    /** 카테고리 목록 캐시 (1시간) */
    CATEGORY_LIST: 60 * 60 * 1000,
  },

  /**
   * 분산 락 TTL (밀리초)
   */
  LOCK: {
    /** 기본 락 TTL (3초) */
    DEFAULT: 3 * 1000,
    /** 쿠폰 발급 락 TTL (3초) */
    COUPON_ISSUE: 3 * 1000,
    /** 재고 차감 락 TTL (5초) */
    STOCK_DEDUCT: 5 * 1000,
  },

  /**
   * 랭킹 데이터 TTL (초 - Redis EXPIRE 호환)
   */
  RANKING: {
    /** 일별 판매 데이터 (7일) */
    DAILY_SALES: 7 * 24 * 60 * 60,
  },

  /**
   * 임시 키 TTL (초)
   */
  TEMP: {
    /** 연산용 임시 키 (1분) */
    OPERATION: 60,
  },

  /**
   * 쿠폰 관련 TTL (초 - Redis EXPIRE 호환)
   */
  COUPON: {
    /** 쿠폰 메타데이터 캐시 (1시간) */
    META: 60 * 60,
    /** 쿠폰 재고 및 발급 사용자 데이터 기본 TTL (7일) */
    STOCK_DATA: 7 * 24 * 60 * 60,
  },
} as const;

/**
 * 분산 락 타임아웃 설정 (밀리초)
 */
export const LockTimeout = {
  /** 총 대기 시간 (10초) */
  TOTAL_TIMEOUT: 10 * 1000,
  /** Pub/Sub 대기 시간 (2초) */
  PUBSUB_WAIT: 2 * 1000,
  /** 재시도 횟수 */
  RETRY_COUNT: 10,
  /** 재시도 딜레이 (200ms) */
  RETRY_DELAY: 200,
  /** 재시도 지터 (200ms) */
  RETRY_JITTER: 200,
  /** 드리프트 팩터 */
  DRIFT_FACTOR: 0.01,
} as const;
