import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { ProcessPaymentResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-004: 결제 처리 Use Case
 */
@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(
    userId: number,
    orderId: number,
    amount: number,
  ): Promise<ProcessPaymentResponseDto> {
    return await this.paymentDomainService.processPayment(
      userId,
      orderId,
      amount,
    );
  }
}
