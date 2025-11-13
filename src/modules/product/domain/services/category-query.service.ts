import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../repositories/category.repository.interface';
import type { IProductCategoryRepository } from '../repositories/product-category.repository.interface';
import { CategoryNotFoundException } from '../exceptions';

/**
 * Category Query Service
 *
 * 카테고리 조회 관련 비즈니스 로직을 담당
 * - CQRS 패턴의 Query 측면
 * - 읽기 전용 작업
 */
@Injectable()
export class CategoryQueryService {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @Inject('IProductCategoryRepository')
    private readonly productCategoryRepository: IProductCategoryRepository,
  ) {}

  /**
   * FR-P-009: 카테고리 목록 조회
   */
  async getCategories(): Promise<
    Array<{
      categoryId: number;
      categoryName: string;
      displayOrder: number;
      productCount: number;
    }>
  > {
    const categories = await this.categoryRepository.findActiveCategories();

    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount =
          await this.productCategoryRepository.countProductsByCategoryId(
            category.id,
          );

        return {
          categoryId: category.id,
          categoryName: category.categoryName,
          displayOrder: category.displayOrder,
          productCount,
        };
      }),
    );

    return categoriesWithCount;
  }

  /**
   * FR-P-010: 카테고리별 상품 수 조회
   */
  async getCategoryProductCount(categoryId: number): Promise<{
    categoryId: number;
    categoryName: string;
    productCount: number;
  }> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new CategoryNotFoundException(categoryId);
    }

    const productCount =
      await this.productCategoryRepository.countProductsByCategoryId(
        categoryId,
      );

    return {
      categoryId: category.id,
      categoryName: category.categoryName,
      productCount,
    };
  }
}
