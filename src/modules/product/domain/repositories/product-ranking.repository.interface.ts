/**
 * 상품 랭킹 Repository 인터페이스
 *
 * Redis SortedSet 기반 상품 판매 랭킹을 관리합니다.
 * DIP(의존성 역전 원칙)를 따라 도메인 레이어에 인터페이스를 정의합니다.
 */
export interface IProductRankingRepository {
  /**
   * 상품 판매 점수 증가 (주문 완료 시 호출)
   *
   * @param productId 상품 ID
   * @param quantity 판매 수량 (증가시킬 점수)
   * @param date 판매 일자 (기본값: 오늘)
   * @returns 증가 후 해당 상품의 총 점수
   */
  incrementScore(
    productId: number,
    quantity: number,
    date?: Date,
  ): Promise<number>;

  /**
   * 여러 상품의 판매 점수 일괄 증가 (파이프라인 사용)
   *
   * @param items 상품 ID와 수량 쌍의 배열
   * @param date 판매 일자 (기본값: 오늘)
   */
  incrementScoreBatch(
    items: Array<{ productId: number; quantity: number }>,
    date?: Date,
  ): Promise<void>;

  /**
   * 기간별 상위 상품 조회
   *
   * @param days 조회 기간 (일 수, 기본값: 3)
   * @param limit 상위 N개 (기본값: 5)
   * @returns 상품 ID와 총 판매 수량 배열 (순위순)
   */
  getTopProducts(
    days?: number,
    limit?: number,
  ): Promise<Array<{ productId: number; totalSales: number }>>;

  /**
   * 특정 일자의 상품 랭킹 조회
   *
   * @param date 조회할 일자
   * @param limit 상위 N개
   * @returns 상품 ID와 판매 수량 배열
   */
  getDailyRanking(
    date: Date,
    limit: number,
  ): Promise<Array<{ productId: number; sales: number }>>;

  /**
   * 특정 상품의 기간별 순위 조회
   *
   * @param productId 상품 ID
   * @param days 조회 기간
   * @returns 순위 (1-based, 없으면 null)
   */
  getProductRank(productId: number, days?: number): Promise<number | null>;
}
