import { Injectable } from '@nestjs/common';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { PrismaService } from 'src/common/prisma';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: bigint;
    product_name: string;
    product_description: string | null;
    thumbnail_url: string | null;
    is_active: boolean;
    view_count: bigint;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): Product {
    return Product.create({
      id: Number(data.id),
      productName: data.product_name,
      productDescription: data.product_description,
      thumbnailUrl: data.thumbnail_url,
      isActive: data.is_active,
      viewCount: Number(data.view_count),
      deletedAt: data.deleted_at?.toISOString() ?? null,
      createdAt: data.created_at.toISOString(),
      updatedAt: data.updated_at.toISOString(),
    });
  }

  async findById(id: number): Promise<Product | null> {
    const product = await this.prisma.products.findUnique({
      where: { id: BigInt(id), deleted_at: null },
    });
    return product ? this.toDomain(product) : null;
  }

  async findAll(): Promise<Product[]> {
    const products = await this.prisma.products.findMany({
      where: { deleted_at: null },
    });
    return products.map((p) => this.toDomain(p));
  }

  async findMany(predicate: (product: Product) => boolean): Promise<Product[]> {
    const products = await this.prisma.products.findMany({
      where: { deleted_at: null },
    });
    return products
      .filter((p) => predicate(this.toDomain(p)))
      .map((p) => this.toDomain(p));
  }

  async create(product: Product): Promise<Product> {
    const created = await this.prisma.products.create({
      data: {
        product_name: product.productName,
        product_description: product.productDescription,
        thumbnail_url: product.thumbnailUrl,
        is_active: product.isActive,
        view_count: BigInt(product.viewCount),
        deleted_at: product.deletedAt ? new Date(product.deletedAt) : null,
        created_at: product.createdAt
          ? new Date(product.createdAt)
          : new Date(),
        updated_at: product.updatedAt
          ? new Date(product.updatedAt)
          : new Date(),
      },
    });
    return this.toDomain(created);
  }

  async update(id: number, updates: Partial<Product>): Promise<Product | null> {
    const updateData: any = { updated_at: new Date() };

    if (updates.productName !== undefined)
      updateData.product_name = updates.productName;
    if (updates.productDescription !== undefined)
      updateData.product_description = updates.productDescription;
    if (updates.thumbnailUrl !== undefined)
      updateData.thumbnail_url = updates.thumbnailUrl;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.viewCount !== undefined)
      updateData.view_count = BigInt(updates.viewCount);

    const updated = await this.prisma.products.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async softDelete(id: number): Promise<void> {
    await this.prisma.products.update({
      where: { id: BigInt(id) },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.products.count({
      where: { id: BigInt(id), deleted_at: null },
    });
    return count > 0;
  }

  async findByCategoryId(categoryId: number): Promise<Product[]> {
    const products = await this.prisma.products.findMany({
      where: {
        deleted_at: null,
        product_categories: {
          some: {
            categories_id: BigInt(categoryId),
          },
        },
      },
    });
    return products.map((p) => this.toDomain(p));
  }

  async findWithPagination(params: {
    categoryId?: number;
    page: number;
    size: number;
    sortBy?: 'newest' | 'popular' | 'price_low' | 'price_high';
  }): Promise<{
    products: Product[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    const { categoryId, page, size, sortBy = 'newest' } = params;
    const skip = (page - 1) * size;

    const where: any = { deleted_at: null };
    if (categoryId) {
      where.product_categories = {
        some: {
          categories_id: BigInt(categoryId),
        },
      };
    }

    let orderBy: any = { created_at: 'desc' }; // newest
    if (sortBy === 'popular') {
      orderBy = { view_count: 'desc' };
    }

    const [products, totalCount] = await Promise.all([
      this.prisma.products.findMany({
        where,
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.products.count({ where }),
    ]);

    return {
      products: products.map((p) => this.toDomain(p)),
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / size),
    };
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.prisma.products.update({
      where: { id: BigInt(id) },
      data: {
        view_count: { increment: 1 },
        updated_at: new Date(),
      },
    });
  }
}
