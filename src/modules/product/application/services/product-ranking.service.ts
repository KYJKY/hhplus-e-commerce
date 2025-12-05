import { Inject, Injectable, Logger } from '@nestjs/common';
import { IProductRankingRepository } from '../../domain/repositories/product-ranking.repository.interface';

/**
 * 상품 랭킹 서비스
 *
 * Application Layer에서 Infrastructure(Redis)를 추상화하여 사용
 * - 판매 랭킹 업데이트
 * - 인기 상품 조회
 */
@Injectable()
export class ProductRankingService {
  private readonly logger = new Logger(ProductRankingService.name);

  constructor(
    @Inject('IProductRankingRepository')
    private readonly productRankingRepository: IProductRankingRepository,
  ) {}

  /**
   * 주문 완료 시 상품 랭킹 업데이트
   *
   * @param items 상품 ID와 판매 수량 배열
   */
  async updateRankingByOrderItems(
    items: Array<{ productId: number; quantity: number }>,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await this.productRankingRepository.incrementScoreBatch(items);
    this.logger.debug(
      `Product ranking updated: ${items.length} products`,
    );
  }

  /**
   * 인기 상품 조회
   *
   * @param days 조회 기간 (기본값: 3일)
   * @param limit 상위 N개 (기본값: 5)
   */
  async getTopProducts(
    days?: number,
    limit?: number,
  ): Promise<Array<{ productId: number; totalSales: number }>> {
    return await this.productRankingRepository.getTopProducts(days, limit);
  }

  /**
   * 특정 상품의 순위 조회
   *
   * @param productId 상품 ID
   * @param days 조회 기간
   */
  async getProductRank(productId: number, days?: number): Promise<number | null> {
    return await this.productRankingRepository.getProductRank(productId, days);
  }
}
