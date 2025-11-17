import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';

/**
 * FR-C-006: 장바구니 전체 삭제 Use Case
 *
 * 비즈니스 흐름:
 * 1. 사용자 존재 확인
 * 2. 사용자의 모든 장바구니 항목 논리적 삭제
 *
 * 비즈니스 규칙:
 * - 사용자의 모든 장바구니 항목 삭제
 * - 논리적 삭제(soft delete)로 처리
 */
@Injectable()
export class ClearCartUseCase {
  constructor(
    private readonly cartDomainService: CartDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(userId: number): Promise<ClearCartResponseDto> {
    // 1. 사용자 존재 확인
    await this.userDomainService.findUserById(userId);

    // 2. 모든 장바구니 항목 삭제
    const deletedCount =
      await this.cartDomainService.deleteAllCartItems(userId);

    return {
      success: true,
      deletedCount,
    };
  }
}

/**
 * Response DTO (임시 타입 - Presentation Layer에서 정의될 예정)
 */
interface ClearCartResponseDto {
  success: boolean;
  deletedCount: number;
}
