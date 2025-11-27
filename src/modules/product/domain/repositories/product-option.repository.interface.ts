import { IRepository } from 'src/common';
import { ProductOption } from '../entities/product-option.entity';

/**
 * ProductOption Repository 인터페이스
 */
export interface IProductOptionRepository extends IRepository<ProductOption> {
  /**
   * 상품 ID로 옵션 목록 조회
   */
  findByProductId(productId: number): Promise<ProductOption[]>;

  /**
   * 재고 차감 (단일 상품)
   */
  deductStock(
    optionId: number,
    quantity: number,
    orderId: number,
  ): Promise<{
    optionId: number;
    previousStock: number;
    deductedQuantity: number;
    currentStock: number;
  }>;

  /**
   * 재고 차감 (복수 상품 - Bulk)
   * Deadlock 방지 및 원자성 보장
   */
  deductStocksBulk(
    items: Array<{ optionId: number; quantity: number }>,
    orderId: number,
  ): Promise<
    Array<{
      optionId: number;
      previousStock: number;
      deductedQuantity: number;
      currentStock: number;
    }>
  >;

  /**
   * 재고 복원
   */
  restoreStock(
    optionId: number,
    quantity: number,
    orderId: number,
  ): Promise<{
    optionId: number;
    previousStock: number;
    restoredQuantity: number;
    currentStock: number;
  }>;
}
