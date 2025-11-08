import { Product } from '../entities/product.entity';

/**
 * Product Repository 인터페이스
 */
export interface IProductRepository {
  /**
   * ID로 상품 조회
   */
  findById(id: number): Promise<Product | null>;

  /**
   * 모든 상품 조회
   */
  findAll(): Promise<Product[]>;

  /**
   * 조건에 맞는 상품 목록 조회
   */
  findMany(predicate: (product: Product) => boolean): Promise<Product[]>;

  /**
   * 상품 생성
   */
  create(product: Product): Promise<Product>;

  /**
   * 상품 수정
   */
  update(id: number, product: Partial<Product>): Promise<Product | null>;

  /**
   * 상품 삭제 (논리적 삭제)
   */
  softDelete(id: number): Promise<void>;

  /**
   * 상품 존재 여부 확인
   */
  exists(id: number): Promise<boolean>;

  /**
   * 카테고리별 상품 조회
   */
  findByCategoryId(categoryId: number): Promise<Product[]>;

  /**
   * 페이지네이션과 정렬을 지원하는 상품 목록 조회
   */
  findWithPagination(params: {
    categoryId?: number;
    page: number;
    size: number;
    sortBy?: 'newest' | 'popular' | 'price_low' | 'price_high';
  }): Promise<{
    products: Product[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }>;

  /**
   * 조회수 증가
   */
  incrementViewCount(id: number): Promise<void>;
}
