import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { ValidatePointDeductionResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-009: 포인트 차감 검증 Use Case
 */
@Injectable()
export class ValidatePointDeductionUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(
    userId: number,
    amount: number,
  ): Promise<ValidatePointDeductionResponseDto> {
    return await this.paymentDomainService.validatePointDeduction(
      userId,
      amount,
    );
  }
}
