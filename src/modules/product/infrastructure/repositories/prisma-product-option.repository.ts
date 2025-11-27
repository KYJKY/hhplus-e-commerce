import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IProductOptionRepository } from '../../domain/repositories/product-option.repository.interface';
import { ProductOption } from '../../domain/entities/product-option.entity';
import { PrismaService } from 'src/common/prisma';

@Injectable()
export class PrismaProductOptionRepository implements IProductOptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: bigint;
    product_id: bigint;
    option_name: string;
    option_description: string | null;
    price_amount: any; // Decimal
    stock_quantity: number;
    is_available: boolean;
    created_at: Date;
    updated_at: Date;
  }): ProductOption {
    return ProductOption.create({
      id: Number(data.id),
      productId: Number(data.product_id),
      optionName: data.option_name,
      optionDescription: data.option_description,
      priceAmount: Number(data.price_amount),
      stockQuantity: data.stock_quantity,
      isAvailable: data.is_available,
      createdAt: data.created_at.toISOString(),
      updatedAt: data.updated_at.toISOString(),
    });
  }

  async findById(id: number): Promise<ProductOption | null> {
    const option = await this.prisma.product_options.findUnique({
      where: { id: BigInt(id) },
    });
    return option ? this.toDomain(option) : null;
  }

  async findByProductId(productId: number): Promise<ProductOption[]> {
    const options = await this.prisma.product_options.findMany({
      where: { product_id: BigInt(productId) },
      orderBy: { created_at: 'asc' },
    });
    return options.map((o) => this.toDomain(o));
  }

  async findOne(
    predicate: (entity: ProductOption) => boolean,
  ): Promise<ProductOption | null> {
    const options = await this.prisma.product_options.findMany();
    const option = options.find((o) => predicate(this.toDomain(o)));
    return option ? this.toDomain(option) : null;
  }

  async findAll(): Promise<ProductOption[]> {
    const options = await this.prisma.product_options.findMany();
    return options.map((o) => this.toDomain(o));
  }

  async findMany(
    predicate: (entity: ProductOption) => boolean,
  ): Promise<ProductOption[]> {
    const options = await this.prisma.product_options.findMany();
    return options
      .filter((o) => predicate(this.toDomain(o)))
      .map((o) => this.toDomain(o));
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.product_options.count({
      where: { id: BigInt(id) },
    });
    return count > 0;
  }

  async create(option: Omit<ProductOption, 'id'>): Promise<ProductOption> {
    const created = await this.prisma.product_options.create({
      data: {
        product_id: BigInt(option.productId),
        option_name: option.optionName,
        option_description: option.optionDescription,
        price_amount: option.priceAmount,
        stock_quantity: option.stockQuantity,
        is_available: option.isAvailable,
        created_at: option.createdAt ? new Date(option.createdAt) : new Date(),
        updated_at: option.updatedAt ? new Date(option.updatedAt) : new Date(),
      },
    });
    return this.toDomain(created);
  }

  async update(
    id: number,
    updates: Partial<ProductOption>,
  ): Promise<ProductOption | null> {
    const updateData: any = { updated_at: new Date() };

    if (updates.optionName !== undefined)
      updateData.option_name = updates.optionName;
    if (updates.optionDescription !== undefined)
      updateData.option_description = updates.optionDescription;
    if (updates.priceAmount !== undefined)
      updateData.price_amount = updates.priceAmount;
    if (updates.stockQuantity !== undefined)
      updateData.stock_quantity = updates.stockQuantity;
    if (updates.isAvailable !== undefined)
      updateData.is_available = updates.isAvailable;

    const updated = await this.prisma.product_options.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.product_options.delete({
        where: { id: BigInt(id) },
      });
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.prisma.product_options.deleteMany();
      return true;
    } catch {
      return false;
    }
  }

  async count(predicate?: (entity: ProductOption) => boolean): Promise<number> {
    if (predicate) {
      const options = await this.prisma.product_options.findMany();
      return options.filter((o) => predicate(this.toDomain(o))).length;
    }
    return await this.prisma.product_options.count();
  }

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
    // Atomic Conditional Update: 재고 확인과 차감을 하나의 원자적 연산으로 처리
    // 재고가 충분한 경우에만 UPDATE가 실행됨 (Race Condition 방지)
    const result = await this.prisma.$executeRaw`
      UPDATE product_options
      SET stock_quantity = stock_quantity - ${quantity},
          updated_at = NOW()
      WHERE id = ${BigInt(optionId)}
        AND stock_quantity >= ${quantity}
    `;

    // 업데이트된 행이 없으면 실패 (옵션이 없거나 재고 부족)
    if (result === 0) {
      // 실패 원인 확인: 옵션이 없는지, 재고가 부족한지 판별
      const option = await this.prisma.product_options.findUnique({
        where: { id: BigInt(optionId) },
      });

      if (!option) {
        throw new Error(`ProductOption with ID ${optionId} not found`);
      }

      throw new Error(
        `Insufficient stock for option ${optionId}. Available: ${option.stock_quantity}, Requested: ${quantity}`,
      );
    }

    // 업데이트된 옵션 조회
    const updated = await this.prisma.product_options.findUnique({
      where: { id: BigInt(optionId) },
    });

    if (!updated) {
      throw new Error(`ProductOption with ID ${optionId} not found after update`);
    }

    return {
      optionId,
      previousStock: updated.stock_quantity + quantity,
      deductedQuantity: quantity,
      currentStock: updated.stock_quantity,
    };
  }

  /**
   * 여러 상품 옵션의 재고를 한 번에 차감 (Atomic Conditional Update)
   * 각 옵션별로 원자적 업데이트를 수행하여 Race Condition 방지
   *
   * @param items - 차감할 상품 옵션 목록 [{ optionId, quantity }]
   * @param orderId - 주문 ID
   * @returns 각 옵션별 차감 결과
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

    // 각 옵션별로 Atomic Conditional Update 수행
    for (const item of items) {
      // 재고 확인과 차감을 하나의 원자적 연산으로 처리
      const updateResult = await this.prisma.$executeRaw`
        UPDATE product_options
        SET stock_quantity = stock_quantity - ${item.quantity},
            updated_at = NOW()
        WHERE id = ${BigInt(item.optionId)}
          AND stock_quantity >= ${item.quantity}
      `;

      // 업데이트된 행이 없으면 실패 (옵션이 없거나 재고 부족)
      if (updateResult === 0) {
        // 실패 원인 확인
        const option = await this.prisma.product_options.findUnique({
          where: { id: BigInt(item.optionId) },
        });

        if (!option) {
          throw new Error(`ProductOption with ID ${item.optionId} not found`);
        }

        throw new Error(
          `Insufficient stock for option ${item.optionId}. Available: ${option.stock_quantity}, Requested: ${item.quantity}`,
        );
      }

      // 업데이트된 옵션 조회
      const updated = await this.prisma.product_options.findUnique({
        where: { id: BigInt(item.optionId) },
      });

      if (!updated) {
        throw new Error(
          `ProductOption with ID ${item.optionId} not found after update`,
        );
      }

      results.push({
        optionId: item.optionId,
        previousStock: updated.stock_quantity + item.quantity,
        deductedQuantity: item.quantity,
        currentStock: updated.stock_quantity,
      });
    }

    return results;
  }

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
    const option = await this.prisma.product_options.findUnique({
      where: { id: BigInt(optionId) },
    });

    if (!option) {
      throw new Error(`ProductOption with ID ${optionId} not found`);
    }

    const previousStock = option.stock_quantity;

    const updated = await this.prisma.product_options.update({
      where: { id: BigInt(optionId) },
      data: {
        stock_quantity: { increment: quantity },
        updated_at: new Date(),
      },
    });

    return {
      optionId,
      previousStock,
      restoredQuantity: quantity,
      currentStock: updated.stock_quantity,
    };
  }
}
