import { Module } from '@nestjs/common';
import { ProductController } from './presentation/product.controller';
import { ProductService } from './application/product.service';
import { InMemoryProductRepository } from './infrastructure/repositories/in-memory-product.repository';
import { InMemoryProductOptionRepository } from './infrastructure/repositories/in-memory-product-option.repository';
import { InMemoryCategoryRepository } from './infrastructure/repositories/in-memory-category.repository';
import { InMemoryProductCategoryRepository } from './infrastructure/repositories/in-memory-product-category.repository';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
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
  ],
  exports: [ProductService],
})
export class ProductModule {}
