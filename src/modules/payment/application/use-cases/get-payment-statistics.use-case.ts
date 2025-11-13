import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { GetPaymentStatisticsResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-010: 결제 통계 조회 Use Case
 */
@Injectable()
export class GetPaymentStatisticsUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(userId: number): Promise<GetPaymentStatisticsResponseDto> {
    // 1. User 도메인: 사용자 확인
    await this.userDomainService.findUserById(userId);

    // 2. Payment 도메인: 결제 통계 조회
    return await this.paymentDomainService.getPaymentStatistics(userId);
  }
}
