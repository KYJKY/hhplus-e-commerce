import { RedisKeyBuilder } from './redis-key.builder';

/**
 * Ranking Key Prefix
 */
const PREFIX = 'ranking';

/**
 * Product 랭킹 키
 */
export const ProductRankingKeys = {
  /**
   * 일별 판매 랭킹 키 (Sorted Set)
   * @example ranking:product:sales:2025-01-15
   */
  dailySales: (date: Date): string =>
    RedisKeyBuilder.build(
      PREFIX,
      'product',
      'sales',
      RedisKeyBuilder.formatDate(date),
    ),

  /**
   * 일별 판매 랭킹 키 목록 생성 (최근 N일)
   */
  dailySalesRange: (days: number): string[] => {
    const keys: string[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      keys.push(ProductRankingKeys.dailySales(date));
    }

    return keys;
  },
} as const;
