import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import {
  GetPointTransactionsRequestDto,
  GetPointTransactionsResponseDto,
} from '../../presentation/dto';

/**
 * FR-PAY-003: 포인트 사용 내역 조회 Use Case
 */
@Injectable()
export class GetPointTransactionsUseCase {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(
    userId: number,
    query: GetPointTransactionsRequestDto,
  ): Promise<GetPointTransactionsResponseDto> {
    // 1. User 도메인: 사용자 확인
    await this.userDomainService.findUserById(userId);

    // 2. Payment 도메인: 거래 내역 조회
    return await this.paymentDomainService.getPointTransactions({
      userId,
      ...query,
    });
  }
}
