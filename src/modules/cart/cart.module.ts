import { Module } from '@nestjs/common';
import { CartController } from './presentation/cart.controller';
import { InMemoryCartItemRepository } from './infrastructure/repositories/in-memory-cart-item.repository';

// Domain Services
import { CartDomainService } from './domain/services/cart-domain.service';

// Use Cases
import {
  GetCartUseCase,
  AddCartItemUseCase,
  UpdateCartItemQuantityUseCase,
  DeleteCartItemUseCase,
  DeleteSelectedCartItemsUseCase,
  ClearCartUseCase,
  GetCartItemCountUseCase,
  ValidateCartItemsUseCase,
  CheckCartStockUseCase,
  ConvertCartToOrderUseCase,
} from './application/use-cases';

// External module dependencies
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    UserModule, // For UserDomainService
    ProductModule, // For ProductQueryService and InventoryDomainService
  ],
  controllers: [CartController],
  providers: [
    // Repositories
    {
      provide: 'ICartItemRepository',
      useClass: InMemoryCartItemRepository,
    },

    // Domain Services
    CartDomainService,

    // Use Cases
    GetCartUseCase,
    AddCartItemUseCase,
    UpdateCartItemQuantityUseCase,
    DeleteCartItemUseCase,
    DeleteSelectedCartItemsUseCase,
    ClearCartUseCase,
    GetCartItemCountUseCase,
    ValidateCartItemsUseCase,
    CheckCartStockUseCase,
    ConvertCartToOrderUseCase,
  ],
  exports: [
    CartDomainService, // For OrderModule to use when clearing cart after payment
  ],
})
export class CartModule {}
