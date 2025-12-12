/**
 * CLS (Continuation Local Storage) 키 상수
 *
 * 요청 컨텍스트에서 사용되는 키들을 정의합니다.
 */
export const CLS_KEYS = {
  /** 요청 추적을 위한 Trace ID */
  TRACE_ID: 'traceId',
  /** 현재 사용자 ID */
  USER_ID: 'userId',
  /** 요청 시작 시간 */
  REQUEST_START_TIME: 'requestStartTime',
} as const;

export type ClsKeys = (typeof CLS_KEYS)[keyof typeof CLS_KEYS];
