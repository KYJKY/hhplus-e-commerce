import { Inject, Injectable } from '@nestjs/common';
import type { IProductRepository } from '../repositories/product.repository.interface';
import type { IProductOptionRepository } from '../repositories/product-option.repository.interface';
import type { ICategoryRepository } from '../repositories/category.repository.interface';
import type { IProductCategoryRepository } from '../repositories/product-category.repository.interface';
import {
  ProductNotFoundException,
  ProductDeletedException,
  OptionNotFoundException,
  OptionNotBelongToProductException,
  CategoryNotFoundException,
} from '../exceptions';

/**
 * Product Query Service
 *
 * 상품 조회 관련 비즈니스 로직을 담당
 * - CQRS 패턴의 Query 측면
 * - 읽기 전용 작업
 */
@Injectable()
export class ProductQueryService {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IProductOptionRepository')
    private readonly productOptionRepository: IProductOptionRepository,
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @Inject('IProductCategoryRepository')
    private readonly productCategoryRepository: IProductCategoryRepository,
  ) {}

  /**
   * FR-P-001: 상품 목록 조회
   */
  async getProductList(params: {
    categoryId?: number;
    page?: number;
    size?: number;
    sortBy?: 'newest' | 'popular' | 'price_low' | 'price_high';
  }): Promise<{
    products: Array<{
      productId: number;
      productName: string;
      thumbnailUrl: string | null;
      minPrice: number;
      maxPrice: number;
      viewCount: number;
      categories: Array<{ categoryId: number; categoryName: string }>;
    }>;
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    const page = params.page ?? 1;
    const size = params.size ?? 20;
    const sortBy = params.sortBy;

    // 카테고리가 지정된 경우 카테고리 존재 확인
    if (params.categoryId) {
      const category = await this.categoryRepository.findById(
        params.categoryId,
      );
      if (!category) {
        throw new CategoryNotFoundException(params.categoryId);
      }
    }

    // 페이지네이션과 정렬을 지원하는 상품 목록 조회
    const result = await this.productRepository.findWithPagination({
      categoryId: params.categoryId,
      page,
      size,
      sortBy,
    });

    // 각 상품의 옵션 및 카테고리 정보 조회
    const productsWithDetails = await Promise.all(
      result.products.map(async (product) => {
        // 옵션 조회
        const options = await this.productOptionRepository.findByProductId(
          product.id,
        );

        // 최저/최고 가격 계산
        const prices = options.map((opt) => opt.priceAmount);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        // 카테고리 조회
        const categoryIds =
          await this.productCategoryRepository.findCategoriesByProductId(
            product.id,
          );
        const categories = await Promise.all(
          categoryIds.map(async (categoryId) => {
            const category = await this.categoryRepository.findById(categoryId);
            return {
              categoryId,
              categoryName: category?.categoryName ?? '',
            };
          }),
        );

        return {
          productId: product.id,
          productName: product.productName,
          thumbnailUrl: product.thumbnailUrl,
          minPrice,
          maxPrice,
          viewCount: product.viewCount,
          categories,
        };
      }),
    );

    return {
      products: productsWithDetails,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }

  /**
   * FR-P-002: 상품 상세 조회
   */
  async getProductDetail(productId: number): Promise<{
    productId: number;
    productName: string;
    productDescription: string | null;
    thumbnailUrl: string | null;
    isActive: boolean;
    viewCount: number;
    categories: Array<{ categoryId: number; categoryName: string }>;
    options: Array<{
      optionId: number;
      optionName: string;
      optionDescription: string | null;
      price: number;
      stockQuantity: number;
      isAvailable: boolean;
    }>;
    createdAt: string;
  }> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundException(productId);
    }

    if (product.isDeleted()) {
      throw new ProductDeletedException(productId);
    }

    // 조회수 증가
    await this.productRepository.incrementViewCount(productId);

    // 옵션 조회
    const options =
      await this.productOptionRepository.findByProductId(productId);

    // 카테고리 조회
    const categoryIds =
      await this.productCategoryRepository.findCategoriesByProductId(productId);
    const categories = await Promise.all(
      categoryIds.map(async (categoryId) => {
        const category = await this.categoryRepository.findById(categoryId);
        return {
          categoryId,
          categoryName: category?.categoryName ?? '',
        };
      }),
    );

    return {
      productId: product.id,
      productName: product.productName,
      productDescription: product.productDescription,
      thumbnailUrl: product.thumbnailUrl,
      isActive: product.isActive,
      viewCount: product.viewCount + 1, // 증가된 조회수
      categories,
      options: options.map((opt) => ({
        optionId: opt.id,
        optionName: opt.optionName,
        optionDescription: opt.optionDescription,
        price: opt.priceAmount,
        stockQuantity: opt.stockQuantity,
        isAvailable: opt.isAvailable,
      })),
      createdAt: product.createdAt,
    };
  }

  /**
   * FR-P-003: 상품 옵션 조회
   */
  async getProductOptions(productId: number): Promise<{
    productId: number;
    productName: string;
    options: Array<{
      optionId: number;
      optionName: string;
      optionDescription: string | null;
      price: number;
      stockQuantity: number;
      isAvailable: boolean;
    }>;
  }> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundException(productId);
    }

    const options =
      await this.productOptionRepository.findByProductId(productId);

    return {
      productId: product.id,
      productName: product.productName,
      options: options.map((opt) => ({
        optionId: opt.id,
        optionName: opt.optionName,
        optionDescription: opt.optionDescription,
        price: opt.priceAmount,
        stockQuantity: opt.stockQuantity,
        isAvailable: opt.isAvailable,
      })),
    };
  }

  /**
   * FR-P-004: 상품 옵션 상세 조회
   */
  async getProductOptionDetail(
    productId: number,
    optionId: number,
  ): Promise<{
    optionId: number;
    productId: number;
    productName: string;
    optionName: string;
    optionDescription: string | null;
    price: number;
    stockQuantity: number;
    isAvailable: boolean;
  }> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundException(productId);
    }

    const option = await this.productOptionRepository.findById(optionId);
    if (!option) {
      throw new OptionNotFoundException(optionId);
    }

    if (option.productId !== productId) {
      throw new OptionNotBelongToProductException(optionId, productId);
    }

    return {
      optionId: option.id,
      productId: product.id,
      productName: product.productName,
      optionName: option.optionName,
      optionDescription: option.optionDescription,
      price: option.priceAmount,
      stockQuantity: option.stockQuantity,
      isAvailable: option.isAvailable,
    };
  }

  /**
   * FR-P-008: 인기 상품 조회 (Top 5)
   * 최근 3일간 판매량 기준 상위 5개 상품 조회
   *
   * 주의: InMemory 구현에서는 주문 데이터가 없으므로 조회수 기준으로 대체
   */
  async getPopularProducts(): Promise<{
    period: string;
    products: Array<{
      rank: number;
      productId: number;
      productName: string;
      thumbnailUrl: string | null;
      salesCount: number;
      salesAmount: number;
    }>;
  }> {
    // InMemory 구현에서는 조회수 기준으로 Top 5 조회
    const allProducts = await this.productRepository.findMany(
      (p) => p.isActive && p.deletedAt === null,
    );

    // 조회수 기준 내림차순 정렬
    const sortedProducts = allProducts
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);

    const products = sortedProducts.map((product, index) => ({
      rank: index + 1,
      productId: product.id,
      productName: product.productName,
      thumbnailUrl: product.thumbnailUrl,
      salesCount: product.viewCount, // InMemory에서는 조회수를 판매량으로 간주
      salesAmount: 0, // 실제 구현에서는 order_items 집계 필요
    }));

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    return {
      period: `${threeDaysAgo.toISOString().split('T')[0]} ~ ${now.toISOString().split('T')[0]}`,
      products,
    };
  }
}
