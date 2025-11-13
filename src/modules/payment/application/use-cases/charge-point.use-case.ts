import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { ChargePointResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-002: 포인트 충전 Use Case
 * User와 Payment 도메인을 조율하여 포인트 충전 처리
 *
 * 리팩토링: Point VO가 직접 도메인 예외를 던지므로 try-catch 제거
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

    // 2. 현재 포인트 VO로 조회
    const currentPointVO = user.getPointVO();
    const previousBalance = currentPointVO.getValue();

    // 3. Point VO를 활용한 충전 시도 (검증 포함)
    // VO가 도메인 예외를 직접 던지므로 별도 처리 불필요
    currentPointVO.charge(amount);

    // 4. User 도메인: 포인트 충전 (Entity의 chargePoint가 VO 사용)
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
