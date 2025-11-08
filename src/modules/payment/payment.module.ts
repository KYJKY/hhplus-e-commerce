import { Module } from '@nestjs/common';
import { PaymentController } from './presentation/payment.controller';
import { PaymentService } from './application/payment.service';
import { InMemoryPointTransactionRepository } from './infrastructure/repositories/in-memory-point-transaction.repository';
import { InMemoryPaymentRepository } from './infrastructure/repositories/in-memory-payment.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule], // User Repository를 사용하기 위해 import
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: 'IPointTransactionRepository',
      useClass: InMemoryPointTransactionRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: InMemoryPaymentRepository,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
