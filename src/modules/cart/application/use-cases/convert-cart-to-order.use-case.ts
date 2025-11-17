import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';

/**
 * FR-C-010: 장바구니 → 주문 전환 (내부 API) Use Case
 *
 * 비즈니스 흐름:
 * 1. 지정된 장바구니 항목 삭제 (권한 확인 포함)
 * 2. 삭제 결과 반환
 *
 * 비즈니스 규칙:
 * - 주문이 성공적으로 생성된 경우에만 호출됨
 * - 논리적 삭제(soft delete)로 처리
 * - 삭제 실패 시에도 주문은 유효하게 유지됨
 * - Order 모듈에서만 호출하는 내부 API
 */
@Injectable()
export class ConvertCartToOrderUseCase {
  constructor(private readonly cartDomainService: CartDomainService) {}

  async execute(
    userId: number,
    cartItemIds: number[],
    orderId: number,
  ): Promise<ConvertCartToOrderResponseDto> {
    // 장바구니 항목 삭제 (권한 확인 포함)
    const deletedCount = await this.cartDomainService.deleteCartItemsByIds(
      userId,
      cartItemIds,
    );

    return {
      success: true,
      deletedCount,
      orderId,
    };
  }
}

/**
 * Response DTO (임시 타입 - Presentation Layer에서 정의될 예정)
 */
interface ConvertCartToOrderResponseDto {
  success: boolean;
  deletedCount: number;
  orderId: number;
}
