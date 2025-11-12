import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { GetPaymentDetailResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-006: 결제 상세 조회 Use Case
 */
@Injectable()
export class GetPaymentDetailUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(
    userId: number,
    paymentId: number,
  ): Promise<GetPaymentDetailResponseDto> {
    return await this.paymentDomainService.getPaymentDetail(userId, paymentId);
  }
}
