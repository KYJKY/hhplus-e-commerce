import { Module } from '@nestjs/common';
import { OrderController } from './presentation/order.controller';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';

// Application Layer
import { OrderMapper } from './application/mappers/order.mapper';
import { ExternalDataTransmissionService } from './application/services/external-data-transmission.service';

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

@Module({
  imports: [],
  controllers: [OrderController],
  providers: [
    // Repository
    {
      provide: 'IOrderRepository',
      useClass: PrismaOrderRepository,
    },

    // Services
    ExternalDataTransmissionService,

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
