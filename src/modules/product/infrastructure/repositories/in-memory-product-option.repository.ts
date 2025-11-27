import { Injectable } from '@nestjs/common';
import { IProductOptionRepository } from '../../domain/repositories/product-option.repository.interface';
import { ProductOption } from '../../domain/entities/product-option.entity';
import { BaseInMemoryRepository } from 'src/common';

@Injectable()
export class InMemoryProductOptionRepository
  extends BaseInMemoryRepository<ProductOption>
  implements IProductOptionRepository
{
  constructor() {
    super();
    this.initializeData();
  }

  /**
   * 초기 테스트 데이터 로드
   */
  private initializeData(): void {
    const now = new Date().toISOString();

    // 상품 1의 옵션들
    const option1 = ProductOption.create({
      id: 1,
      productId: 1,
      optionName: '화이트 / S',
      optionDescription: '화이트 색상 S 사이즈',
      priceAmount: 29000,
      stockQuantity: 100,
      isAvailable: true,
      createdAt: now,
      updatedAt: null,
    });

    const option2 = ProductOption.create({
      id: 2,
      productId: 1,
      optionName: '화이트 / M',
      optionDescription: '화이트 색상 M 사이즈',
      priceAmount: 29000,
      stockQuantity: 150,
      isAvailable: true,
      createdAt: now,
      updatedAt: null,
    });

    const option3 = ProductOption.create({
      id: 3,
      productId: 1,
      optionName: '블랙 / S',
      optionDescription: '블랙 색상 S 사이즈',
      priceAmount: 29000,
      stockQuantity: 80,
      isAvailable: true,
      createdAt: now,
      updatedAt: null,
    });

    // 상품 2의 옵션들
    const option4 = ProductOption.create({
      id: 4,
      productId: 2,
      optionName: '블루 / 28',
      optionDescription: '블루 색상 28인치',
      priceAmount: 79000,
      stockQuantity: 50,
      isAvailable: true,
      createdAt: now,
      updatedAt: null,
    });

    const option5 = ProductOption.create({
      id: 5,
      productId: 2,
      optionName: '블루 / 30',
      optionDescription: '블루 색상 30인치',
      priceAmount: 79000,
      stockQuantity: 60,
      isAvailable: true,
      createdAt: now,
      updatedAt: null,
    });

    // 상품 3의 옵션들
    const option6 = ProductOption.create({
      id: 6,
      productId: 3,
      optionName: '그레이 / M',
      optionDescription: '그레이 색상 M 사이즈',
      priceAmount: 59000,
      stockQuantity: 120,
      isAvailable: true,
      createdAt: now,
      updatedAt: null,
    });

    this.entities.set(1, option1);
    this.entities.set(2, option2);
    this.entities.set(3, option3);
    this.entities.set(4, option4);
    this.entities.set(5, option5);
    this.entities.set(6, option6);

    // currentId를 마지막 ID 다음으로 설정
    this.currentId = 7;
  }

  /**
   * Plain object를 ProductOption 엔티티로 변환
   */
  private toEntity(data: ProductOption): ProductOption {
    return ProductOption.create({
      id: data.id,
      productId: data.productId,
      optionName: data.optionName,
      optionDescription: data.optionDescription,
      priceAmount: data.priceAmount,
      stockQuantity: data.stockQuantity,
      isAvailable: data.isAvailable,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 단일 엔티티 조회 오버라이드
   */
  override async findById(id: number): Promise<ProductOption | null> {
    const entity = await super.findById(id);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 조건에 맞는 단일 엔티티 조회 오버라이드
   */
  override async findOne(
    predicate: (entity: ProductOption) => boolean,
  ): Promise<ProductOption | null> {
    const entity = await super.findOne(predicate);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 모든 엔티티 조회 오버라이드
   */
  override async findAll(): Promise<ProductOption[]> {
    const entities = await super.findAll();
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 조건에 맞는 엔티티 목록 조회 오버라이드
   */
  override async findMany(
    predicate: (entity: ProductOption) => boolean,
  ): Promise<ProductOption[]> {
    const entities = await super.findMany(predicate);
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 엔티티 수정 오버라이드
   */
  override async update(
    id: number,
    entityData: Partial<ProductOption>,
  ): Promise<ProductOption | null> {
    const entity = await super.update(id, entityData);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 상품 ID로 옵션 목록 조회
   */
  async findByProductId(productId: number): Promise<ProductOption[]> {
    return this.findMany((option) => option.productId === productId);
  }

  /**
   * 재고 차감
   */
  async deductStock(
    optionId: number,
    quantity: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _orderId: number,
  ): Promise<{
    optionId: number;
    previousStock: number;
    deductedQuantity: number;
    currentStock: number;
  }> {
    const option = await this.findById(optionId);
    if (!option) {
      throw new Error(`Option with ID ${optionId} not found`);
    }

    const previousStock = option.stockQuantity;
    option.deductStock(quantity);
    await this.update(optionId, option);

    return {
      optionId,
      previousStock,
      deductedQuantity: quantity,
      currentStock: option.stockQuantity,
    };
  }

  /**
   * 재고 차감 (복수 상품 - Bulk)
   */
  async deductStocksBulk(
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
    const results: Array<{
      optionId: number;
      previousStock: number;
      deductedQuantity: number;
      currentStock: number;
    }> = [];

    // 각 아이템에 대해 순차적으로 재고 차감
    for (const item of items) {
      const result = await this.deductStock(
        item.optionId,
        item.quantity,
        orderId,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * 재고 복원
   */
  async restoreStock(
    optionId: number,
    quantity: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _orderId: number,
  ): Promise<{
    optionId: number;
    previousStock: number;
    restoredQuantity: number;
    currentStock: number;
  }> {
    const option = await this.findById(optionId);
    if (!option) {
      throw new Error(`Option with ID ${optionId} not found`);
    }

    const previousStock = option.stockQuantity;
    option.restoreStock(quantity);
    await this.update(optionId, option);

    return {
      optionId,
      previousStock,
      restoredQuantity: quantity,
      currentStock: option.stockQuantity,
    };
  }
}
