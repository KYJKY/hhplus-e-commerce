import { Module } from '@nestjs/common';
import { ProductController } from './presentation/product.controller';
import {
  InMemoryProductRepository,
  InMemoryProductOptionRepository,
  InMemoryCategoryRepository,
  InMemoryProductCategoryRepository,
  PrismaProductRepository,
  PrismaProductOptionRepository,
  PrismaCategoryRepository,
  PrismaProductCategoryRepository,
  RedisProductRankingRepository,
} from './infrastructure/repositories';

// Domain Services (리팩토링: 3개의 서비스로 분할)
import { ProductQueryService } from './domain/services/product-query.service';
import { InventoryDomainService } from './domain/services/inventory-domain.service';
import { CategoryQueryService } from './domain/services/category-query.service';

// Application Services
import { ProductRankingService } from './application/services/product-ranking.service';

// Use Cases
import {
  GetProductListUseCase,
  GetProductDetailUseCase,
  GetProductOptionsUseCase,
  GetProductOptionDetailUseCase,
  CheckStockUseCase,
  DeductStockUseCase,
  RestoreStockUseCase,
  GetPopularProductsUseCase,
  GetCategoriesUseCase,
  GetCategoryProductCountUseCase,
} from './application/use-cases';

@Module({
  controllers: [ProductController],
  providers: [
    // Repositories
    {
      provide: 'IProductRepository',
      useClass:
        process.env.USE_IN_MEMORY_DB === 'true'
          ? InMemoryProductRepository
          : PrismaProductRepository,
    },
    {
      provide: 'IProductOptionRepository',
      useClass:
        process.env.USE_IN_MEMORY_DB === 'true'
          ? InMemoryProductOptionRepository
          : PrismaProductOptionRepository,
    },
    {
      provide: 'ICategoryRepository',
      useClass:
        process.env.USE_IN_MEMORY_DB === 'true'
          ? InMemoryCategoryRepository
          : PrismaCategoryRepository,
    },
    {
      provide: 'IProductCategoryRepository',
      useClass:
        process.env.USE_IN_MEMORY_DB === 'true'
          ? InMemoryProductCategoryRepository
          : PrismaProductCategoryRepository,
    },
    {
      provide: 'IProductRankingRepository',
      useClass: RedisProductRankingRepository,
    },

    // Domain Services (리팩토링: 책임별로 분리)
    ProductQueryService, // 상품 조회
    InventoryDomainService, // 재고 관리
    CategoryQueryService, // 카테고리 조회

    // Application Services
    ProductRankingService, // 상품 랭킹 관리

    // Use Cases
    GetProductListUseCase,
    GetProductDetailUseCase,
    GetProductOptionsUseCase,
    GetProductOptionDetailUseCase,
    CheckStockUseCase,
    DeductStockUseCase,
    RestoreStockUseCase,
    GetPopularProductsUseCase,
    GetCategoriesUseCase,
    GetCategoryProductCountUseCase,
  ],
  exports: [
    ProductQueryService,
    InventoryDomainService,
    CategoryQueryService,
    ProductRankingService,
  ],
})
export class ProductModule {}
