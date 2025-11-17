import { Injectable } from '@nestjs/common';
import { ICartItemRepository } from '../../domain/repositories/cart-item.repository.interface';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { BaseInMemoryRepository } from 'src/common';

@Injectable()
export class InMemoryCartItemRepository
  extends BaseInMemoryRepository<CartItem>
  implements ICartItemRepository
{
  constructor() {
    super();
    this.initializeData();
  }

  /**
   * 초기 테스트 데이터 로드
   */
  private initializeData(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // User 1의 장바구니 항목 (3개)
    const item1 = CartItem.create({
      id: 1,
      userId: 1,
      productId: 1,
      productOptionId: 1, // 화이트 / S
      quantity: 2,
      deletedAt: null,
      createdAt: twoDaysAgo,
      updatedAt: oneHourAgo,
    });

    const item2 = CartItem.create({
      id: 2,
      userId: 1,
      productId: 2,
      productOptionId: 4, // 블루 / 28
      quantity: 1,
      deletedAt: null,
      createdAt: twoDaysAgo,
      updatedAt: null,
    });

    const item3 = CartItem.create({
      id: 3,
      userId: 1,
      productId: 3,
      productOptionId: 6, // 그레이 / M
      quantity: 3,
      deletedAt: null,
      createdAt: oneHourAgo,
      updatedAt: null,
    });

    // User 2의 장바구니 항목 (2개)
    const item4 = CartItem.create({
      id: 4,
      userId: 2,
      productId: 1,
      productOptionId: 2, // 화이트 / M
      quantity: 1,
      deletedAt: null,
      createdAt: twoDaysAgo,
      updatedAt: null,
    });

    const item5 = CartItem.create({
      id: 5,
      userId: 2,
      productId: 2,
      productOptionId: 5, // 블루 / 30
      quantity: 2,
      deletedAt: null,
      createdAt: oneHourAgo,
      updatedAt: null,
    });

    this.entities.set(1, item1);
    this.entities.set(2, item2);
    this.entities.set(3, item3);
    this.entities.set(4, item4);
    this.entities.set(5, item5);

    // currentId를 마지막 ID 다음으로 설정
    this.currentId = 6;
  }

  /**
   * Plain object를 CartItem 엔티티로 변환
   */
  private toEntity(data: CartItem): CartItem {
    return CartItem.create({
      id: data.id,
      userId: data.userId,
      productId: data.productId,
      productOptionId: data.productOptionId,
      quantity: data.quantity,
      deletedAt: data.deletedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 삭제되지 않은 항목만 필터링하는 predicate
   */
  private isNotDeleted(entity: CartItem): boolean {
    return entity.deletedAt === null;
  }

  /**
   * 단일 엔티티 조회 오버라이드
   */
  override async findById(id: number): Promise<CartItem | null> {
    const entity = await super.findById(id);
    if (!entity || !this.isNotDeleted(entity)) {
      return null;
    }
    return this.toEntity(entity);
  }

  /**
   * 조건에 맞는 단일 엔티티 조회 오버라이드
   */
  override async findOne(
    predicate: (entity: CartItem) => boolean,
  ): Promise<CartItem | null> {
    const entity = await super.findOne(
      (e) => this.isNotDeleted(e) && predicate(e),
    );
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 모든 엔티티 조회 오버라이드
   */
  override async findAll(): Promise<CartItem[]> {
    const entities = await super.findAll();
    return entities
      .filter((e) => this.isNotDeleted(e))
      .map((entity) => this.toEntity(entity));
  }

  /**
   * 조건에 맞는 엔티티 목록 조회 오버라이드
   */
  override async findMany(
    predicate: (entity: CartItem) => boolean,
  ): Promise<CartItem[]> {
    const entities = await super.findMany(
      (e) => this.isNotDeleted(e) && predicate(e),
    );
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 장바구니 항목 수정
   */
  async update(id: number, updates: Partial<CartItem>): Promise<CartItem> {
    const entity = await super.update(id, updates);
    if (!entity) {
      throw new Error(`CartItem with ID ${id} not found`);
    }
    return this.toEntity(entity);
  }

  /**
   * 사용자의 장바구니 항목 목록 조회 (삭제되지 않은 항목만)
   */
  async findByUserId(userId: number): Promise<CartItem[]> {
    return this.findMany((item) => item.userId === userId);
  }

  /**
   * 사용자와 상품 옵션으로 장바구니 항목 조회 (삭제되지 않은 항목만)
   * UNIQUE(user_id, product_option_id) 제약 조건 활용
   */
  async findByUserAndOption(
    userId: number,
    optionId: number,
  ): Promise<CartItem | null> {
    return this.findOne(
      (item) => item.userId === userId && item.productOptionId === optionId,
    );
  }

  /**
   * 여러 ID로 장바구니 항목 조회 (삭제되지 않은 항목만)
   */
  async findByIds(ids: number[]): Promise<CartItem[]> {
    return this.findMany((item) => ids.includes(item.id));
  }

  /**
   * 장바구니 항목 생성
   */
  async save(cartItem: Omit<CartItem, 'id'>): Promise<CartItem> {
    const id = this.getNextId();
    const entity = CartItem.create({
      id,
      userId: cartItem.userId,
      productId: cartItem.productId,
      productOptionId: cartItem.productOptionId,
      quantity: cartItem.quantity,
      deletedAt: cartItem.deletedAt ?? null,
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt ?? null,
    });
    this.entities.set(id, entity);
    return await this.delay(this.toEntity(entity));
  }

  /**
   * 장바구니 항목 삭제 (논리적 삭제)
   * 주의: BaseInMemoryRepository의 delete()는 사용하지 않음 (반환 타입 불일치)
   */
  // @ts-expect-error - 도메인 인터페이스는 Promise<void>, 베이스 클래스는 Promise<boolean>
  async delete(id: number): Promise<void> {
    const entity = this.entities.get(id);
    if (!entity) {
      await this.delay(undefined);
      return;
    }

    const updated = CartItem.create({
      id: entity.id,
      userId: entity.userId,
      productId: entity.productId,
      productOptionId: entity.productOptionId,
      quantity: entity.quantity,
      deletedAt: new Date().toISOString(),
      createdAt: entity.createdAt,
      updatedAt: new Date().toISOString(),
    });

    this.entities.set(id, updated);
    await this.delay(undefined);
  }

  /**
   * 여러 장바구니 항목 삭제 (논리적 삭제)
   * @returns 삭제된 항목 수
   */
  async deleteByIds(ids: number[]): Promise<number> {
    let deletedCount = 0;
    const now = new Date().toISOString();

    for (const id of ids) {
      const entity = this.entities.get(id);
      if (entity && this.isNotDeleted(entity)) {
        const updated = CartItem.create({
          id: entity.id,
          userId: entity.userId,
          productId: entity.productId,
          productOptionId: entity.productOptionId,
          quantity: entity.quantity,
          deletedAt: now,
          createdAt: entity.createdAt,
          updatedAt: now,
        });

        this.entities.set(id, updated);
        deletedCount++;
      }
    }

    return await this.delay(deletedCount);
  }

  /**
   * 사용자의 모든 장바구니 항목 삭제 (논리적 삭제)
   * @returns 삭제된 항목 수
   */
  async deleteAllByUserId(userId: number): Promise<number> {
    let deletedCount = 0;
    const now = new Date().toISOString();

    for (const [id, entity] of this.entities.entries()) {
      if (entity.userId === userId && this.isNotDeleted(entity)) {
        const updated = CartItem.create({
          id: entity.id,
          userId: entity.userId,
          productId: entity.productId,
          productOptionId: entity.productOptionId,
          quantity: entity.quantity,
          deletedAt: now,
          createdAt: entity.createdAt,
          updatedAt: now,
        });

        this.entities.set(id, updated);
        deletedCount++;
      }
    }

    return await this.delay(deletedCount);
  }

  /**
   * 사용자의 장바구니 항목 개수 조회 (삭제되지 않은 항목만)
   */
  async countByUserId(userId: number): Promise<number> {
    return this.count(
      (item) => item.userId === userId && this.isNotDeleted(item),
    );
  }

  /**
   * 장바구니 항목 존재 여부 확인
   */
  override async exists(id: number): Promise<boolean> {
    const entity = this.entities.get(id);
    const result = entity ? this.isNotDeleted(entity) : false;
    return await this.delay(result);
  }
}
