import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { ProcessPaymentFailureResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-008: 결제 실패 처리 Use Case
 */
@Injectable()
export class ProcessPaymentFailureUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(
    userId: number,
    orderId: number,
    amount: number,
    failureReason: string,
  ): Promise<ProcessPaymentFailureResponseDto> {
    // 1. User 도메인: 사용자 확인
    await this.userDomainService.findUserById(userId);

    // 2. Payment 도메인: 실패 결제 정보 생성
    return await this.paymentDomainService.processPaymentFailure(
      userId,
      orderId,
      amount,
      failureReason,
    );
  }
}
