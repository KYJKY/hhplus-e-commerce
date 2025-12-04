/**
 * Redis Key Builder
 *
 * Redis 키를 타입 안전하게 생성하는 유틸리티 클래스
 * - 일관된 키 구조 보장
 * - 오타 방지
 * - IDE 자동완성 지원
 */
export class RedisKeyBuilder {
  private static readonly SEPARATOR = ':';

  /**
   * 키 조합 헬퍼
   * @example RedisKeyBuilder.build('cache', 'product', 'detail', 123) => 'cache:product:detail:123'
   */
  static build(...parts: (string | number)[]): string {
    return parts.join(this.SEPARATOR);
  }

  /**
   * 날짜를 YYYY-MM-DD 포맷으로 변환
   * @example RedisKeyBuilder.formatDate(new Date('2025-01-15')) => '2025-01-15'
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Short UUID 생성 (8자리)
   * @example RedisKeyBuilder.generateShortUuid() => 'a1b2c3d4'
   */
  static generateShortUuid(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}
