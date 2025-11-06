/**
 * Category 데이터 모델 (영속성 계층)
 */
export class CategoryModel {
  id: number;
  categoryName: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;

  constructor(
    id: number,
    categoryName: string,
    displayOrder: number,
    isActive: boolean,
    createdAt: string,
    updatedAt: string | null,
  ) {
    this.id = id;
    this.categoryName = categoryName;
    this.displayOrder = displayOrder;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
