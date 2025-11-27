import { Inject, Injectable } from '@nestjs/common';
import type { IProductRepository } from '../repositories/product.repository.interface';
import type { IProductOptionRepository } from '../repositories/product-option.repository.interface';
import {
  ProductNotFoundException,
  OptionNotFoundException,
  InsufficientStockException,
  InvalidQuantityException,
} from '../exceptions';

/**
 * Inventory Domain Service
 *
 * 재고 관리 관련 비즈니스 로직을 담당
 * - CQRS 패턴의 Command 측면
 * - 재고 차감/복원 작업
 * - StockQuantity VO를 활용한 재고 관리
 */
@Injectable()
export class InventoryDomainService {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IProductOptionRepository')
    private readonly productOptionRepository: IProductOptionRepository,
  ) {}

  /**
   * FR-P-005: 재고 확인
   */
  async checkStock(
    optionId: number,
    quantity: number,
  ): Promise<{
    optionId: number;
    productId: number;
    productName: string;
    optionName: string;
    currentStock: number;
    requestedQuantity: number;
    isAvailable: boolean;
  }> {
    const option = await this.productOptionRepository.findById(optionId);
    if (!option) {
      throw new OptionNotFoundException(optionId);
    }

    const product = await this.productRepository.findById(option.productId);
    if (!product) {
      throw new ProductNotFoundException(option.productId);
    }

    const isAvailable = option.hasEnoughStock(quantity);

    return {
      optionId: option.id,
      productId: product.id,
      productName: product.productName,
      optionName: option.optionName,
      currentStock: option.stockQuantity,
      requestedQuantity: quantity,
      isAvailable,
    };
  }

  /**
   * FR-P-006: 재고 차감 (내부 API)
   * StockQuantity VO를 활용한 재고 관리
   */
  async deductStock(
    optionId: number,
    quantity: number,
    orderId: number,
  ): Promise<{
    optionId: number;
    previousStock: number;
    deductedQuantity: number;
    currentStock: number;
  }> {
    if (quantity <= 0) {
      throw new InvalidQuantityException(quantity);
    }

    const option = await this.productOptionRepository.findById(optionId);
    if (!option) {
      throw new OptionNotFoundException(optionId);
    }

    // StockQuantity VO의 hasEnough() 메서드 활용
    // option.hasEnoughStock()은 내부적으로 VO 사용
    if (!option.hasEnoughStock(quantity)) {
      // VO를 통한 현재 재고 조회
      const currentStock = option.getStockQuantityVO().getValue();
      throw new InsufficientStockException(optionId, quantity, currentStock);
    }

    // Repository의 deductStock은 Entity의 deductStock() 호출
    // Entity의 deductStock()은 StockQuantity VO 사용
    return await this.productOptionRepository.deductStock(
      optionId,
      quantity,
      orderId,
    );
  }

  /**
   * 여러 재고를 한 번에 차감 (주문 결제 시 사용)
   * Bulk FOR UPDATE로 원자성 및 Deadlock 방지 보장
   *
   * 개선 사항:
   * - Promise.all 병렬 처리 제거 → Bulk 처리
   * - 모든 상품을 한 번에 잠금 (정렬된 순서)
   * - Deadlock 방지 및 Race Condition 완전 해결
   */
  async deductStocks(
    items: Array<{ optionId: number; quantity: number }>,
    orderId: number,
  ): Promise<
    Array<{
      optionId: number;
      previousStock: number;
      deductedQuantity: number;
      currentStock: number;
    }>
  > {
    // 수량 검증
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new InvalidQuantityException(item.quantity);
      }
    }

    // Repository의 Bulk 메서드 호출
    // 내부적으로 모든 행을 한 번에 FOR UPDATE로 잠금
    return await this.productOptionRepository.deductStocksBulk(items, orderId);
  }

  /**
   * FR-P-007: 재고 복원 (내부 API)
   * StockQuantity VO를 활용한 재고 관리
   */
  async restoreStock(
    optionId: number,
    quantity: number,
    orderId: number,
  ): Promise<{
    optionId: number;
    previousStock: number;
    restoredQuantity: number;
    currentStock: number;
  }> {
    if (quantity <= 0) {
      throw new InvalidQuantityException(quantity);
    }

    const option = await this.productOptionRepository.findById(optionId);
    if (!option) {
      throw new OptionNotFoundException(optionId);
    }

    // Repository의 restoreStock은 Entity의 restoreStock() 호출
    // Entity의 restoreStock()은 StockQuantity VO 사용
    return await this.productOptionRepository.restoreStock(
      optionId,
      quantity,
      orderId,
    );
  }
}
