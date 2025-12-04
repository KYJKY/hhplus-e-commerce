import { RedisKeyBuilder } from './redis-key.builder';

/**
 * Temp Key Prefix
 */
const PREFIX = 'temp';

/**
 * Ranking 연산용 임시 키
 */
export const RankingTempKeys = {
  /**
   * 판매 합산용 임시 키
   * @example temp:ranking:sales:1704067200000:a1b2c3d4
   */
  salesUnion: (): string =>
    RedisKeyBuilder.build(
      PREFIX,
      'ranking',
      'sales',
      Date.now(),
      RedisKeyBuilder.generateShortUuid(),
    ),

  /**
   * 순위 조회용 임시 키
   * @example temp:ranking:rank:1704067200000:a1b2c3d4
   */
  rankQuery: (): string =>
    RedisKeyBuilder.build(
      PREFIX,
      'ranking',
      'rank',
      Date.now(),
      RedisKeyBuilder.generateShortUuid(),
    ),
} as const;
