import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { ChargePointResponseDto } from '../../presentation/dto';
import {
  InvalidChargeAmountException,
  ChargeAmountUnitErrorException,
  MaxBalanceExceededException,
} from '../../domain/exceptions';

/**
 * FR-PAY-002: 포인트 충전 Use Case
 * User와 Payment 도메인을 조율하여 포인트 충전 처리
 */
@Injectable()
export class ChargePointUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(
    userId: number,
    amount: number,
  ): Promise<ChargePointResponseDto> {
    // 1. User 도메인: 사용자 확인
    const user = await this.userDomainService.findUserById(userId);

    // 2. 충전 금액 검증 (비즈니스 규칙)
    if (amount < 1000 || amount > 1000000) {
      throw new InvalidChargeAmountException(amount);
    }

    if (amount % 1000 !== 0) {
      throw new ChargeAmountUnitErrorException(amount);
    }

    const previousBalance = user.getPoint();

    // 3. 최대 보유 가능 포인트 확인
    if (previousBalance + amount > 10000000) {
      throw new MaxBalanceExceededException(previousBalance, amount);
    }

    // 4. User 도메인: 포인트 충전
    const { currentBalance } = await this.userDomainService.chargeUserPoint(
      userId,
      amount,
    );

    // 5. Payment 도메인: 거래 내역 생성
    return await this.paymentDomainService.chargePoint(
      userId,
      amount,
      previousBalance,
      currentBalance,
    );
  }
}
