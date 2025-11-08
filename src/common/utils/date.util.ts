/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 현재 시간 반환 (ISO 8601 형식)
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 날짜가 만료되었는지 확인
 */
export function isExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * N일 후 날짜 반환
 */
export function addDays(days: number, fromDate: Date = new Date()): Date {
  const result = new Date(fromDate);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 날짜를 한국 시간대로 포맷팅
 */
export function formatToKST(date: Date): string {
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
