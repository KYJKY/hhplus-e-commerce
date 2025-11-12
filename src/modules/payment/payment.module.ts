import { Module } from '@nestjs/common';
import { PaymentController } from './presentation/payment.controller';
import { InMemoryPointTransactionRepository } from './infrastructure/repositories/in-memory-point-transaction.repository';
import { InMemoryPaymentRepository } from './infrastructure/repositories/in-memory-payment.repository';
import { UserModule } from '../user/user.module';

// Domain Services
import { PaymentDomainService } from './domain/services/payment-domain.service';

// Use Cases
import {
  GetBalanceUseCase,
  ChargePointUseCase,
  GetPointTransactionsUseCase,
  ProcessPaymentUseCase,
  GetPaymentsUseCase,
  GetPaymentDetailUseCase,
  ProcessPaymentFailureUseCase,
  ValidatePointDeductionUseCase,
  GetPaymentStatisticsUseCase,
} from './application/use-cases';

@Module({
  imports: [UserModule], // UserDomainService를 사용하기 위해 import
  controllers: [PaymentController],
  providers: [
    // Repositories
    {
      provide: 'IPointTransactionRepository',
      useClass: InMemoryPointTransactionRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: InMemoryPaymentRepository,
    },

    // Domain Services
    PaymentDomainService,

    // Use Cases
    GetBalanceUseCase,
    ChargePointUseCase,
    GetPointTransactionsUseCase,
    ProcessPaymentUseCase,
    GetPaymentsUseCase,
    GetPaymentDetailUseCase,
    ProcessPaymentFailureUseCase,
    ValidatePointDeductionUseCase,
    GetPaymentStatisticsUseCase,
  ],
  exports: [PaymentDomainService],
})
export class PaymentModule {}
