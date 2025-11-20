import { Module } from '@nestjs/common';
import { PaymentController } from './presentation/payment.controller';
import {
  InMemoryPointTransactionRepository,
  InMemoryPaymentRepository,
  PrismaPointTransactionRepository,
  PrismaPaymentRepository,
} from './infrastructure/repositories';
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
      useClass:
        process.env.USE_IN_MEMORY_DB === 'true'
          ? InMemoryPointTransactionRepository
          : PrismaPointTransactionRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass:
        process.env.USE_IN_MEMORY_DB === 'true'
          ? InMemoryPaymentRepository
          : PrismaPaymentRepository,
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
