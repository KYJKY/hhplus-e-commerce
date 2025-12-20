/**
 * Kafka Topic 상수 정의
 */
export const KAFKA_TOPICS = {
  /** 주문 완료 이벤트 토픽 */
  ORDER_COMPLETED: 'order.completed',
} as const;

/**
 * Kafka 설정 상수
 */
export const KAFKA_CONFIG = {
  /** 기본 브로커 주소 */
  DEFAULT_BROKERS: ['localhost:9094'] as string[],
  /** 클라이언트 ID */
  CLIENT_ID: 'hhplus-ecommerce',
  /** Producer 설정 */
  PRODUCER: {
    /** 연결 타임아웃 (ms) */
    CONNECTION_TIMEOUT: 10000,
    /** 요청 타임아웃 (ms) */
    REQUEST_TIMEOUT: 30000,
    /** 재시도 횟수 */
    RETRY_COUNT: 3,
  },
  /** Consumer 설정 */
  CONSUMER: {
    /** Consumer Group ID */
    GROUP_ID: 'hhplus-ecommerce-consumer',
    /** 세션 타임아웃 (ms) */
    SESSION_TIMEOUT: 30000,
    /** 하트비트 간격 (ms) */
    HEARTBEAT_INTERVAL: 3000,
    /** 처음부터 메시지 읽기 (예제용) */
    FROM_BEGINNING: true,
  },
};
