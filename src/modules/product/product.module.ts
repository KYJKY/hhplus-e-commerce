import { Module } from '@nestjs/common';
import { ProductController } from './presentation/product.controller';
import {
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
      useClass: PrismaProductRepository,
    },
    {
      provide: 'IProductOptionRepository',
      useClass: PrismaProductOptionRepository,
    },
    {
      provide: 'ICategoryRepository',
      useClass: PrismaCategoryRepository,
    },
    {
      provide: 'IProductCategoryRepository',
      useClass: PrismaProductCategoryRepository,
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
