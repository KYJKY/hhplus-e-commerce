import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { ProcessPaymentResponseDto } from '../../presentation/dto';
import {
  InvalidPaymentAmountException,
  InsufficientBalanceException,
} from '../../domain/exceptions';

/**
 * FR-PAY-004: 결제 처리 Use Case
 * User와 Payment 도메인을 조율하여 결제 처리
 */
@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(
    userId: number,
    orderId: number,
    amount: number,
  ): Promise<ProcessPaymentResponseDto> {
    // 1. 결제 금액 검증
    if (amount < 1) {
      throw new InvalidPaymentAmountException(amount);
    }

    // 2. User 도메인: 사용자 확인
    const user = await this.userDomainService.findUserById(userId);

    // 3. Point VO를 통한 잔액 확인 및 검증
    const currentPointVO = user.getPointVO();
    const previousBalance = currentPointVO.getValue();

    // 4. VO를 활용한 잔액 충분 여부 확인
    if (!currentPointVO.hasSufficientBalance(amount)) {
      throw new InsufficientBalanceException(previousBalance, amount);
    }

    // 5. User 도메인: 포인트 차감 (Entity의 deductPoint가 VO 사용)
    const { currentBalance } = await this.userDomainService.deductUserPoint(
      userId,
      amount,
    );

    // 6. Payment 도메인: 결제 정보 및 거래 내역 생성
    return await this.paymentDomainService.processPayment(
      userId,
      orderId,
      amount,
      previousBalance,
      currentBalance,
    );
  }
}
