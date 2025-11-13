import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { ValidatePointDeductionResponseDto } from '../../presentation/dto';
import { InvalidAmountException } from '../../domain/exceptions';

/**
 * FR-PAY-009: 포인트 차감 검증 Use Case
 * User와 Payment 도메인을 조율하여 차감 가능 여부 검증
 */
@Injectable()
export class ValidatePointDeductionUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(
    userId: number,
    amount: number,
  ): Promise<ValidatePointDeductionResponseDto> {
    // 1. 금액 검증
    if (amount < 1) {
      throw new InvalidAmountException(amount);
    }

    // 2. User 도메인: 사용자 확인 및 잔액 조회
    const user = await this.userDomainService.findUserById(userId);

    // 3. Payment 도메인: 차감 가능 여부 검증
    return await this.paymentDomainService.validatePointDeduction(
      userId,
      user.getPoint(),
      amount,
    );
  }
}
