import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { ChargePointResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-002: 포인트 충전 Use Case
 */
@Injectable()
export class ChargePointUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(
    userId: number,
    amount: number,
  ): Promise<ChargePointResponseDto> {
    return await this.paymentDomainService.chargePoint(userId, amount);
  }
}
