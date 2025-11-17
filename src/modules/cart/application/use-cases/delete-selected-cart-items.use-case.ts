import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';

/**
 * FR-C-005: 장바구니 선택 항목 삭제 Use Case
 *
 * 비즈니스 흐름:
 * 1. 여러 장바구니 항목 조회 및 권한 확인
 * 2. 논리적 삭제 수행
 *
 * 비즈니스 규칙:
 * - 소유자만 삭제 가능
 * - 논리적 삭제(soft delete)로 처리
 * - 일부 항목 삭제 실패 시에도 나머지 항목은 정상 삭제
 */
@Injectable()
export class DeleteSelectedCartItemsUseCase {
  constructor(private readonly cartDomainService: CartDomainService) {}

  async execute(
    userId: number,
    cartItemIds: number[],
  ): Promise<DeleteSelectedCartItemsResponseDto> {
    // 여러 장바구니 항목 삭제 (권한 확인 포함)
    const deletedCount = await this.cartDomainService.deleteCartItemsByIds(
      userId,
      cartItemIds,
    );

    return {
      success: true,
      deletedCount,
      deletedCartItemIds: cartItemIds.slice(0, deletedCount),
    };
  }
}

/**
 * Response DTO (임시 타입 - Presentation Layer에서 정의될 예정)
 */
interface DeleteSelectedCartItemsResponseDto {
  success: boolean;
  deletedCount: number;
  deletedCartItemIds: number[];
}
