import { Module } from '@nestjs/common';
import { PaymentController } from './presentation/payment.controller';
import {
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
      useClass: PrismaPointTransactionRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: PrismaPaymentRepository,
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
