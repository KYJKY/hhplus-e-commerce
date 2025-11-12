import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { ProcessPaymentFailureResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-008: 결제 실패 처리 Use Case
 */
@Injectable()
export class ProcessPaymentFailureUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(
    userId: number,
    orderId: number,
    amount: number,
    failureReason: string,
  ): Promise<ProcessPaymentFailureResponseDto> {
    return await this.paymentDomainService.processPaymentFailure(
      userId,
      orderId,
      amount,
      failureReason,
    );
  }
}
