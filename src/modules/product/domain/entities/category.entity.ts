/**
 * Category 생성 속성
 */
export interface CreateCategoryProps {
  id: number;
  categoryName: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Category 수정 속성
 */
export interface UpdateCategoryProps {
  categoryName?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Category 도메인 엔티티
 */
export class Category {
  private constructor(
    public readonly id: number,
    public categoryName: string,
    public displayOrder: number,
    public isActive: boolean,
    public readonly createdAt: string,
    public updatedAt: string | null,
  ) {}

  /**
   * Category 엔티티 생성 팩토리 메서드
   */
  static create(props: CreateCategoryProps): Category {
    // 검증
    this.validateCategoryName(props.categoryName);
    this.validateDisplayOrder(props.displayOrder ?? 0);

    return new Category(
      props.id,
      props.categoryName,
      props.displayOrder ?? 0,
      props.isActive ?? true,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  /**
   * 카테고리 정보 수정
   */
  update(props: UpdateCategoryProps): void {
    if (props.categoryName !== undefined) {
      Category.validateCategoryName(props.categoryName);
      this.categoryName = props.categoryName;
    }

    if (props.displayOrder !== undefined) {
      Category.validateDisplayOrder(props.displayOrder);
      this.displayOrder = props.displayOrder;
    }

    if (props.isActive !== undefined) {
      this.isActive = props.isActive;
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * 카테고리명 검증 (1~50자)
   */
  private static validateCategoryName(categoryName: string): void {
    if (
      !categoryName ||
      categoryName.trim().length < 1 ||
      categoryName.trim().length > 50
    ) {
      throw new Error('Category name must be between 1 and 50 characters');
    }
  }

  /**
   * 표시 순서 검증 (0 이상)
   */
  private static validateDisplayOrder(displayOrder: number): void {
    if (displayOrder < 0) {
      throw new Error('Display order must be greater than or equal to 0');
    }
  }
}
