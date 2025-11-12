import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
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
  ) {}

  async execute(
    userId: number,
    query: GetPointTransactionsRequestDto,
  ): Promise<GetPointTransactionsResponseDto> {
    return await this.paymentDomainService.getPointTransactions({
      userId,
      ...query,
    });
  }
}
