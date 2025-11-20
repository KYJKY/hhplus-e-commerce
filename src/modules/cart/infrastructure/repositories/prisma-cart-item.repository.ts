import { Injectable } from '@nestjs/common';
import { ICartItemRepository } from '../../domain/repositories/cart-item.repository.interface';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { PrismaService } from 'src/common/prisma';

/**
 * Prisma 기반 CartItem Repository 구현체
 *
 * Infrastructure 계층에서 Prisma를 사용하여 실제 DB 접근 담당
 */
@Injectable()
export class PrismaCartItemRepository implements ICartItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prisma 모델을 Domain Entity로 변환
   */
  private toDomain(data: {
    id: bigint;
    user_id: bigint;
    product_id: bigint;
    product_option_id: bigint;
    quantity: number;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): CartItem {
    return CartItem.create({
      id: Number(data.id),
      userId: Number(data.user_id),
      productId: Number(data.product_id),
      productOptionId: Number(data.product_option_id),
      quantity: data.quantity,
      deletedAt: data.deleted_at?.toISOString() ?? null,
      createdAt: data.created_at.toISOString(),
      updatedAt: data.updated_at.toISOString(),
    });
  }

  /**
   * ID로 장바구니 항목 조회
   */
  async findById(id: number): Promise<CartItem | null> {
    const item = await this.prisma.cart_items.findUnique({
      where: { id: BigInt(id), deleted_at: null },
    });

    return item ? this.toDomain(item) : null;
  }

  /**
   * 사용자의 장바구니 항목 목록 조회 (삭제되지 않은 항목만)
   */
  async findByUserId(userId: number): Promise<CartItem[]> {
    const items = await this.prisma.cart_items.findMany({
      where: {
        user_id: BigInt(userId),
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
    });

    return items.map((item) => this.toDomain(item));
  }

  /**
   * 사용자와 상품 옵션으로 장바구니 항목 조회 (삭제되지 않은 항목만)
   * UNIQUE(user_id, product_option_id) 제약 조건 활용
   */
  async findByUserAndOption(
    userId: number,
    optionId: number,
  ): Promise<CartItem | null> {
    const item = await this.prisma.cart_items.findFirst({
      where: {
        user_id: BigInt(userId),
        product_option_id: BigInt(optionId),
        deleted_at: null,
      },
    });

    return item ? this.toDomain(item) : null;
  }

  /**
   * 여러 ID로 장바구니 항목 조회 (삭제되지 않은 항목만)
   */
  async findByIds(ids: number[]): Promise<CartItem[]> {
    const items = await this.prisma.cart_items.findMany({
      where: {
        id: { in: ids.map((id) => BigInt(id)) },
        deleted_at: null,
      },
    });

    return items.map((item) => this.toDomain(item));
  }

  /**
   * 장바구니 항목 생성
   */
  async save(cartItem: Omit<CartItem, 'id'>): Promise<CartItem> {
    const created = await this.prisma.cart_items.create({
      data: {
        user_id: BigInt(cartItem.userId),
        product_id: BigInt(cartItem.productId),
        product_option_id: BigInt(cartItem.productOptionId),
        quantity: cartItem.quantity,
        deleted_at: cartItem.deletedAt ? new Date(cartItem.deletedAt) : null,
        created_at: cartItem.createdAt
          ? new Date(cartItem.createdAt)
          : new Date(),
        updated_at: cartItem.updatedAt
          ? new Date(cartItem.updatedAt)
          : new Date(),
      },
    });

    return this.toDomain(created);
  }

  /**
   * 장바구니 항목 수정
   */
  async update(id: number, updates: Partial<CartItem>): Promise<CartItem> {
    const updateData: any = {};

    if (updates.quantity !== undefined) {
      updateData.quantity = updates.quantity;
    }
    if (updates.deletedAt !== undefined) {
      updateData.deleted_at = updates.deletedAt
        ? new Date(updates.deletedAt)
        : null;
    }

    // 항상 updated_at 갱신
    updateData.updated_at = new Date();

    const updated = await this.prisma.cart_items.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return this.toDomain(updated);
  }

  /**
   * 장바구니 항목 삭제 (논리적 삭제)
   */
  async delete(id: number): Promise<void> {
    await this.prisma.cart_items.update({
      where: { id: BigInt(id) },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * 여러 장바구니 항목 삭제 (논리적 삭제)
   * @returns 삭제된 항목 수
   */
  async deleteByIds(ids: number[]): Promise<number> {
    const result = await this.prisma.cart_items.updateMany({
      where: {
        id: { in: ids.map((id) => BigInt(id)) },
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    return result.count;
  }

  /**
   * 사용자의 모든 장바구니 항목 삭제 (논리적 삭제)
   * @returns 삭제된 항목 수
   */
  async deleteAllByUserId(userId: number): Promise<number> {
    const result = await this.prisma.cart_items.updateMany({
      where: {
        user_id: BigInt(userId),
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    return result.count;
  }

  /**
   * 사용자의 장바구니 항목 개수 조회 (삭제되지 않은 항목만)
   */
  async countByUserId(userId: number): Promise<number> {
    return await this.prisma.cart_items.count({
      where: {
        user_id: BigInt(userId),
        deleted_at: null,
      },
    });
  }

  /**
   * 장바구니 항목 존재 여부 확인
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.cart_items.count({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    return count > 0;
  }
}
