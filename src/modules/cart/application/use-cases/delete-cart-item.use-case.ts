import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';
import { CartMapper } from '../mappers/cart.mapper';
import { DeletedCartItemDto } from '../dtos';

/**
 * FR-C-004: 장바구니 항목 삭제 Use Case
 *
 * 비즈니스 흐름:
 * 1. 장바구니 항목 조회 및 권한 확인
 * 2. 논리적 삭제 수행
 *
 * 비즈니스 규칙:
 * - 소유자만 삭제 가능
 * - 논리적 삭제(soft delete)로 처리
 */
@Injectable()
export class DeleteCartItemUseCase {
  constructor(
    private readonly cartDomainService: CartDomainService,
    private readonly cartMapper: CartMapper,
  ) {}

  async execute(
    userId: number,
    cartItemId: number,
  ): Promise<DeletedCartItemDto> {
    // 장바구니 항목 삭제 (권한 확인 포함)
    await this.cartDomainService.deleteCartItem(userId, cartItemId);

    return this.cartMapper.toDeletedCartItemDto(cartItemId);
  }
}
