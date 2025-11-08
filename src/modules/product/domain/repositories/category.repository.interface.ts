import { IRepository } from 'src/common';
import { Category } from '../entities/category.entity';

/**
 * Category Repository 인터페이스
 */
export interface ICategoryRepository extends IRepository<Category> {
  /**
   * 활성화된 카테고리 목록 조회 (displayOrder 오름차순)
   */
  findActiveCategories(): Promise<Category[]>;
}
