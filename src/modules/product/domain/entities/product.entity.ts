/**
 * Product 생성 속성
 */
export interface CreateProductProps {
  id: number;
  productName: string;
  productDescription?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
  viewCount?: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Product 수정 속성
 */
export interface UpdateProductProps {
  productName?: string;
  productDescription?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
}

/**
 * Product 도메인 엔티티
 */
export class Product {
  private constructor(
    public readonly id: number,
    public productName: string,
    public productDescription: string | null,
    public thumbnailUrl: string | null,
    public isActive: boolean,
    public viewCount: number,
    public deletedAt: string | null,
    public readonly createdAt: string,
    public updatedAt: string | null,
  ) {}

  /**
   * Product 엔티티 생성 팩토리 메서드
   */
  static create(props: CreateProductProps): Product {
    // 검증
    this.validateProductName(props.productName);

    return new Product(
      props.id,
      props.productName,
      props.productDescription ?? null,
      props.thumbnailUrl ?? null,
      props.isActive ?? true,
      props.viewCount ?? 0,
      props.deletedAt ?? null,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  /**
   * 상품 정보 수정
   */
  update(props: UpdateProductProps): void {
    if (props.productName !== undefined) {
      Product.validateProductName(props.productName);
      this.productName = props.productName;
    }

    if (props.productDescription !== undefined) {
      this.productDescription = props.productDescription;
    }

    if (props.thumbnailUrl !== undefined) {
      this.thumbnailUrl = props.thumbnailUrl;
    }

    if (props.isActive !== undefined) {
      this.isActive = props.isActive;
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * 조회수 증가
   */
  incrementViewCount(): void {
    this.viewCount += 1;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 논리적 삭제
   */
  softDelete(): void {
    this.deletedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 삭제 여부 확인
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * 상품명 검증 (1~200자)
   */
  private static validateProductName(productName: string): void {
    if (
      !productName ||
      productName.trim().length < 1 ||
      productName.trim().length > 200
    ) {
      throw new Error('Product name must be between 1 and 200 characters');
    }
  }
}
