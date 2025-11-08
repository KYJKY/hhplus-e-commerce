/**
 * ProductCategory Repository 인터페이스
 * (Product와 Category 간의 N:M 관계 관리)
 */
export interface IProductCategoryRepository {
  /**
   * 상품에 카테고리 연결
   */
  addCategoryToProduct(productId: number, categoryId: number): Promise<void>;

  /**
   * 상품에서 카테고리 제거
   */
  removeCategoryFromProduct(
    productId: number,
    categoryId: number,
  ): Promise<void>;

  /**
   * 상품의 모든 카테고리 조회
   */
  findCategoriesByProductId(productId: number): Promise<number[]>;

  /**
   * 카테고리의 모든 상품 조회
   */
  findProductsByCategoryId(categoryId: number): Promise<number[]>;

  /**
   * 상품의 모든 카테고리 제거
   */
  removeAllCategoriesFromProduct(productId: number): Promise<void>;

  /**
   * 카테고리별 상품 수 조회
   */
  countProductsByCategoryId(categoryId: number): Promise<number>;
}
