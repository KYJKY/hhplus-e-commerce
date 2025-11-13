import { Injectable } from '@nestjs/common';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { BaseInMemoryRepository } from 'src/common';

@Injectable()
export class InMemoryProductRepository
  extends BaseInMemoryRepository<Product>
  implements IProductRepository
{
  constructor() {
    super();
    this.initializeData();
  }

  /**
   * 초기 테스트 데이터 로드
   */
  private initializeData(): void {
    const now = new Date().toISOString();

    // 테스트 상품 1
    const product1 = Product.create({
      id: 1,
      productName: '베이직 티셔츠',
      productDescription: '편안한 착용감의 베이직 티셔츠',
      thumbnailUrl: 'https://example.com/images/tshirt1.jpg',
      isActive: true,
      viewCount: 150,
      deletedAt: null,
      createdAt: now,
      updatedAt: null,
    });

    // 테스트 상품 2
    const product2 = Product.create({
      id: 2,
      productName: '슬림핏 청바지',
      productDescription: '슬림한 핏의 청바지',
      thumbnailUrl: 'https://example.com/images/jeans1.jpg',
      isActive: true,
      viewCount: 200,
      deletedAt: null,
      createdAt: now,
      updatedAt: null,
    });

    // 테스트 상품 3
    const product3 = Product.create({
      id: 3,
      productName: '후드 집업',
      productDescription: '따뜻한 후드 집업',
      thumbnailUrl: 'https://example.com/images/hoodie1.jpg',
      isActive: true,
      viewCount: 300,
      deletedAt: null,
      createdAt: now,
      updatedAt: null,
    });

    this.entities.set(1, product1);
    this.entities.set(2, product2);
    this.entities.set(3, product3);

    // currentId를 마지막 ID 다음으로 설정
    this.currentId = 4;
  }

  /**
   * Plain object를 Product 엔티티로 변환
   */
  private toEntity(data: Product): Product {
    return Product.create({
      id: data.id,
      productName: data.productName,
      productDescription: data.productDescription,
      thumbnailUrl: data.thumbnailUrl,
      isActive: data.isActive,
      viewCount: data.viewCount,
      deletedAt: data.deletedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 단일 엔티티 조회 오버라이드
   */
  override async findById(id: number): Promise<Product | null> {
    const entity = await super.findById(id);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 조건에 맞는 단일 엔티티 조회 오버라이드
   */
  override async findOne(
    predicate: (entity: Product) => boolean,
  ): Promise<Product | null> {
    const entity = await super.findOne(predicate);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 모든 엔티티 조회 오버라이드
   */
  override async findAll(): Promise<Product[]> {
    const entities = await super.findAll();
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 조건에 맞는 엔티티 목록 조회 오버라이드
   */
  override async findMany(
    predicate: (entity: Product) => boolean,
  ): Promise<Product[]> {
    const entities = await super.findMany(predicate);
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 엔티티 수정 오버라이드
   */
  override async update(
    id: number,
    entityData: Partial<Product>,
  ): Promise<Product | null> {
    const entity = await super.update(id, entityData);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 논리적 삭제
   */
  async softDelete(id: number): Promise<void> {
    const product = await this.findById(id);
    if (product) {
      product.softDelete();
      await this.update(id, product);
    }
  }

  /**
   * 카테고리별 상품 조회
   * (InMemory 구현에서는 ProductCategoryRepository와 함께 사용 필요)
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async findByCategoryId(_categoryId: number): Promise<Product[]> {
    // InMemory 구현에서는 별도 로직이 필요하지만, 여기서는 간단히 구현
    // 실제로는 ProductCategoryRepository를 통해 productId를 가져와야 함
    return [];
  }

  /**
   * 페이지네이션과 정렬을 지원하는 상품 목록 조회
   */
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
    // 활성화되고 삭제되지 않은 상품만 조회
    const products = await this.findMany(
      (p) => p.isActive && p.deletedAt === null,
    );

    // 정렬
    if (params.sortBy === 'newest') {
      products.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (params.sortBy === 'popular') {
      products.sort((a, b) => b.viewCount - a.viewCount);
    }
    // price_low, price_high는 ProductOption 정보가 필요하므로 여기서는 구현하지 않음

    const totalCount = products.length;
    const totalPages = Math.ceil(totalCount / params.size);
    const startIndex = (params.page - 1) * params.size;
    const endIndex = startIndex + params.size;

    return {
      products: products.slice(startIndex, endIndex),
      totalCount,
      currentPage: params.page,
      totalPages,
    };
  }

  /**
   * 조회수 증가
   */
  async incrementViewCount(id: number): Promise<void> {
    const product = await this.findById(id);
    if (product) {
      product.incrementViewCount();
      await this.update(id, product);
    }
  }
}
