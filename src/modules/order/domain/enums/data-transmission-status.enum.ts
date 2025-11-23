/**
 * 외부 데이터 전송 상태
 *
 * - SUCCESS: 전송 성공
 * - FAILED: 전송 실패 (재시도 후)
 * - PENDING: 전송 대기 중
 */
export enum DataTransmissionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}
