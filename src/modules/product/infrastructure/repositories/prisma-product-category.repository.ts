import { Injectable } from '@nestjs/common';
import { IProductCategoryRepository } from '../../domain/repositories/product-category.repository.interface';
import { PrismaService } from 'src/common/prisma';

@Injectable()
export class PrismaProductCategoryRepository
  implements IProductCategoryRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async addCategoryToProduct(
    productId: number,
    categoryId: number,
  ): Promise<void> {
    await this.prisma.product_categories.create({
      data: {
        product_id: BigInt(productId),
        categories_id: BigInt(categoryId),
      },
    });
  }

  async removeCategoryFromProduct(
    productId: number,
    categoryId: number,
  ): Promise<void> {
    await this.prisma.product_categories.delete({
      where: {
        product_id_categories_id: {
          product_id: BigInt(productId),
          categories_id: BigInt(categoryId),
        },
      },
    });
  }

  async findCategoriesByProductId(productId: number): Promise<number[]> {
    const relations = await this.prisma.product_categories.findMany({
      where: { product_id: BigInt(productId) },
    });
    return relations.map((r) => Number(r.categories_id));
  }

  async findProductsByCategoryId(categoryId: number): Promise<number[]> {
    const relations = await this.prisma.product_categories.findMany({
      where: { categories_id: BigInt(categoryId) },
    });
    return relations.map((r) => Number(r.product_id));
  }

  async removeAllCategoriesFromProduct(productId: number): Promise<void> {
    await this.prisma.product_categories.deleteMany({
      where: { product_id: BigInt(productId) },
    });
  }

  async countProductsByCategoryId(categoryId: number): Promise<number> {
    return await this.prisma.product_categories.count({
      where: { categories_id: BigInt(categoryId) },
    });
  }
}
