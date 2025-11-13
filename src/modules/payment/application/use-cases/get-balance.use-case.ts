import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { GetBalanceResponseDto } from '../../presentation/dto';

/**
 * FR-PAY-001: 포인트 잔액 조회 Use Case
 * User와 Payment 도메인을 조율하여 잔액 조회
 */
@Injectable()
export class GetBalanceUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(userId: number): Promise<GetBalanceResponseDto> {
    // 1. User 도메인: 사용자 확인 및 잔액 조회
    const user = await this.userDomainService.findUserById(userId);

    // 2. Payment 도메인: 최근 거래 내역 조회
    return await this.paymentDomainService.getBalance(
      userId,
      user.getPoint(),
      user.createdAt,
    );
  }
}
