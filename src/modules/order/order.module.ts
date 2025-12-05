import { Module } from '@nestjs/common';
import { OrderController } from './presentation/order.controller';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';
import { OrderDomainService } from './domain/services/order-domain.service';
import { OrderPaymentDomainService } from './domain/services/order-payment-domain.service';

// Application Layer
import { OrderMapper } from './application/mappers/order.mapper';
import { ExternalDataTransmissionService } from './application/services/external-data-transmission.service';
import { PostPaymentService } from './application/services/post-payment.service';

// Use Cases
import {
  CreateOrderUseCase,
  GetOrderListUseCase,
  GetOrderDetailUseCase,
  ChangeOrderStatusUseCase,
  ProcessOrderPaymentUseCase,
  CompleteOrderUseCase,
  GetOrderStatisticsUseCase,
} from './application/use-cases';

// External module dependencies
import { CartModule } from '../cart/cart.module';
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';
import { CouponModule } from '../coupon/coupon.module';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    CartModule,
    UserModule,
    ProductModule,
    CouponModule,
    PaymentModule,
    PrismaModule,
  ],
  controllers: [OrderController],
  providers: [
    // Repository
    {
      provide: 'IOrderRepository',
      useClass: PrismaOrderRepository,
    },

    // Domain Services
    OrderDomainService,
    OrderPaymentDomainService,

    // Application Services
    ExternalDataTransmissionService,
    PostPaymentService,

    // Mappers
    OrderMapper,

    // Use Cases
    CreateOrderUseCase,
    GetOrderListUseCase,
    GetOrderDetailUseCase,
    ChangeOrderStatusUseCase,
    ProcessOrderPaymentUseCase,
    CompleteOrderUseCase,
    GetOrderStatisticsUseCase,
  ],
  exports: [
    // 다른 모듈에서 사용할 수 있도록 export
    // (현재는 없지만 나중에 추가 가능)
  ],
})
export class OrderModule {}
