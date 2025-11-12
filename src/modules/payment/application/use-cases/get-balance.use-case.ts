import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { GetBalanceResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-001: 포인트 잔액 조회 Use Case
 */
@Injectable()
export class GetBalanceUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(userId: number): Promise<GetBalanceResponseDto> {
    return await this.paymentDomainService.getBalance(userId);
  }
}
