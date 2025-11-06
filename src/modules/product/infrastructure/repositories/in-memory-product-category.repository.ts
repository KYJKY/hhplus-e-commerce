import { Injectable } from '@nestjs/common';
import { IProductCategoryRepository } from '../../domain/repositories/product-category.repository.interface';

/**
 * ProductCategory 조인 테이블 데이터
 */
interface ProductCategoryData {
  productId: number;
  categoryId: number;
}

@Injectable()
export class InMemoryProductCategoryRepository
  implements IProductCategoryRepository
{
  private productCategories: ProductCategoryData[] = [];

  constructor() {
    this.initializeData();
  }

  /**
   * 초기 테스트 데이터 로드
   */
  private initializeData(): void {
    // 상품 1: 상의 카테고리
    this.productCategories.push({ productId: 1, categoryId: 1 });

    // 상품 2: 하의 카테고리
    this.productCategories.push({ productId: 2, categoryId: 2 });

    // 상품 3: 상의, 아우터 카테고리 (다중 카테고리)
    this.productCategories.push({ productId: 3, categoryId: 1 });
    this.productCategories.push({ productId: 3, categoryId: 3 });
  }

  /**
   * 상품에 카테고리 연결
   */
  async addCategoryToProduct(
    productId: number,
    categoryId: number,
  ): Promise<void> {
    // 이미 존재하는 관계인지 확인
    const exists = this.productCategories.some(
      (pc) => pc.productId === productId && pc.categoryId === categoryId,
    );

    if (!exists) {
      this.productCategories.push({ productId, categoryId });
    }
  }

  /**
   * 상품에서 카테고리 제거
   */
  async removeCategoryFromProduct(
    productId: number,
    categoryId: number,
  ): Promise<void> {
    this.productCategories = this.productCategories.filter(
      (pc) => !(pc.productId === productId && pc.categoryId === categoryId),
    );
  }

  /**
   * 상품의 모든 카테고리 조회
   */
  async findCategoriesByProductId(productId: number): Promise<number[]> {
    return this.productCategories
      .filter((pc) => pc.productId === productId)
      .map((pc) => pc.categoryId);
  }

  /**
   * 카테고리의 모든 상품 조회
   */
  async findProductsByCategoryId(categoryId: number): Promise<number[]> {
    return this.productCategories
      .filter((pc) => pc.categoryId === categoryId)
      .map((pc) => pc.productId);
  }

  /**
   * 상품의 모든 카테고리 제거
   */
  async removeAllCategoriesFromProduct(productId: number): Promise<void> {
    this.productCategories = this.productCategories.filter(
      (pc) => pc.productId !== productId,
    );
  }

  /**
   * 카테고리별 상품 수 조회
   */
  async countProductsByCategoryId(categoryId: number): Promise<number> {
    return this.productCategories.filter((pc) => pc.categoryId === categoryId)
      .length;
  }
}
