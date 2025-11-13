import { Module } from '@nestjs/common';
import { ProductController } from './presentation/product.controller';
import { InMemoryProductRepository } from './infrastructure/repositories/in-memory-product.repository';
import { InMemoryProductOptionRepository } from './infrastructure/repositories/in-memory-product-option.repository';
import { InMemoryCategoryRepository } from './infrastructure/repositories/in-memory-category.repository';
import { InMemoryProductCategoryRepository } from './infrastructure/repositories/in-memory-product-category.repository';

// Domain Services (리팩토링: 3개의 서비스로 분할)
import { ProductQueryService } from './domain/services/product-query.service';
import { InventoryDomainService } from './domain/services/inventory-domain.service';
import { CategoryQueryService } from './domain/services/category-query.service';

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
      useClass: InMemoryProductRepository,
    },
    {
      provide: 'IProductOptionRepository',
      useClass: InMemoryProductOptionRepository,
    },
    {
      provide: 'ICategoryRepository',
      useClass: InMemoryCategoryRepository,
    },
    {
      provide: 'IProductCategoryRepository',
      useClass: InMemoryProductCategoryRepository,
    },

    // Domain Services (리팩토링: 책임별로 분리)
    ProductQueryService, // 상품 조회
    InventoryDomainService, // 재고 관리
    CategoryQueryService, // 카테고리 조회

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
    // Order 모듈에서 재고 관리를 위해 InventoryDomainService를 export
    ProductQueryService,
    InventoryDomainService,
    CategoryQueryService,
  ],
})
export class ProductModule {}
