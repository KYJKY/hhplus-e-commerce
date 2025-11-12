import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import {
  GetPaymentsRequestDto,
  GetPaymentsResponseDto,
} from '../../presentation/dto';

/**
 * FR-PAY-005: 결제 내역 조회 Use Case
 */
@Injectable()
export class GetPaymentsUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(
    userId: number,
    query: GetPaymentsRequestDto,
  ): Promise<GetPaymentsResponseDto> {
    return await this.paymentDomainService.getPayments({
      userId,
      ...query,
    });
  }
}
