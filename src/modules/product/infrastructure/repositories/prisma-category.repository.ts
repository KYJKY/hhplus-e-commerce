import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { PrismaService } from 'src/common/prisma';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: bigint;
    category_name: string;
    display_order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }): Category {
    return Category.create({
      id: Number(data.id),
      categoryName: data.category_name,
      displayOrder: data.display_order,
      isActive: data.is_active,
      createdAt: data.created_at.toISOString(),
      updatedAt: data.updated_at.toISOString(),
    });
  }

  async findById(id: number): Promise<Category | null> {
    const category = await this.prisma.categories.findUnique({
      where: { id: BigInt(id) },
    });
    return category ? this.toDomain(category) : null;
  }

  async findActiveCategories(): Promise<Category[]> {
    const categories = await this.prisma.categories.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });
    return categories.map((c) => this.toDomain(c));
  }

  async findOne(
    predicate: (entity: Category) => boolean,
  ): Promise<Category | null> {
    const categories = await this.prisma.categories.findMany();
    const category = categories.find((c) => predicate(this.toDomain(c)));
    return category ? this.toDomain(category) : null;
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.categories.findMany();
    return categories.map((c) => this.toDomain(c));
  }

  async findMany(
    predicate: (entity: Category) => boolean,
  ): Promise<Category[]> {
    const categories = await this.prisma.categories.findMany();
    return categories
      .filter((c) => predicate(this.toDomain(c)))
      .map((c) => this.toDomain(c));
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.categories.count({
      where: { id: BigInt(id) },
    });
    return count > 0;
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const created = await this.prisma.categories.create({
      data: {
        category_name: category.categoryName,
        display_order: category.displayOrder,
        is_active: category.isActive,
        created_at: category.createdAt
          ? new Date(category.createdAt)
          : new Date(),
        updated_at: category.updatedAt
          ? new Date(category.updatedAt)
          : new Date(),
      },
    });
    return this.toDomain(created);
  }

  async update(
    id: number,
    updates: Partial<Category>,
  ): Promise<Category | null> {
    const updateData: any = { updated_at: new Date() };

    if (updates.categoryName !== undefined)
      updateData.category_name = updates.categoryName;
    if (updates.displayOrder !== undefined)
      updateData.display_order = updates.displayOrder;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const updated = await this.prisma.categories.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.categories.delete({
        where: { id: BigInt(id) },
      });
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.prisma.categories.deleteMany();
      return true;
    } catch {
      return false;
    }
  }

  async count(predicate?: (entity: Category) => boolean): Promise<number> {
    if (predicate) {
      const categories = await this.prisma.categories.findMany();
      return categories.filter((c) => predicate(this.toDomain(c))).length;
    }
    return await this.prisma.categories.count();
  }
}
