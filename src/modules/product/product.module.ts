import { Module } from '@nestjs/common';
import { ProductController } from './presentation/product.controller';
import { InMemoryProductRepository } from './infrastructure/repositories/in-memory-product.repository';
import { InMemoryProductOptionRepository } from './infrastructure/repositories/in-memory-product-option.repository';
import { InMemoryCategoryRepository } from './infrastructure/repositories/in-memory-category.repository';
import { InMemoryProductCategoryRepository } from './infrastructure/repositories/in-memory-product-category.repository';

// Domain Services
import { ProductDomainService } from './domain/services/product-domain.service';

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

    // Domain Services
    ProductDomainService,

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
  exports: [ProductDomainService],
})
export class ProductModule {}
