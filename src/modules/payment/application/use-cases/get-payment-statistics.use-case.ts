import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { GetPaymentStatisticsResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-010: 결제 통계 조회 Use Case
 */
@Injectable()
export class GetPaymentStatisticsUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(userId: number): Promise<GetPaymentStatisticsResponseDto> {
    return await this.paymentDomainService.getPaymentStatistics(userId);
  }
}
