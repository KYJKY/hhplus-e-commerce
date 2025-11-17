import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { ProductQueryService } from '../../../product/domain/services/product-query.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { CartMapper } from '../mappers/cart.mapper';
import { CartItemCountDto } from '../dtos';

/**
 * FR-C-008: 장바구니 항목 개수 조회 Use Case
 *
 * 비즈니스 흐름:
 * 1. 사용자 존재 확인
 * 2. 사용자의 장바구니 항목 조회
 * 3. 각 항목의 구매 가능 여부 확인
 * 4. 전체/가능/불가능 항목 개수 집계
 *
 * 비즈니스 규칙:
 * - 논리적으로 삭제되지 않은 항목만 카운트
 * - 재고 및 판매 상태 기준으로 구매 가능 여부 판단
 */
@Injectable()
export class GetCartItemCountUseCase {
  constructor(
    private readonly cartDomainService: CartDomainService,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly productQueryService: ProductQueryService,
    private readonly userDomainService: UserDomainService,
    private readonly cartMapper: CartMapper,
  ) {}

  async execute(userId: number): Promise<CartItemCountDto> {
    // 1. 사용자 존재 확인
    await this.userDomainService.findUserById(userId);

    // 2. 사용자의 장바구니 항목 조회
    const cartItems =
      await this.cartDomainService.findCartItemsByUserId(userId);

    const totalItems = cartItems.length;

    // 3. 각 항목의 구매 가능 여부 확인
    const availabilityResults = await Promise.all(
      cartItems.map(async (cartItem) => {
        try {
          // 재고 확인
          const stockCheck = await this.inventoryDomainService.checkStock(
            cartItem.productOptionId,
            cartItem.quantity,
          );

          // 옵션 상세 조회
          const optionDetail =
            await this.productQueryService.getProductOptionDetail(
              cartItem.productId,
              cartItem.productOptionId,
            );

          return stockCheck.isAvailable && optionDetail.isAvailable;
        } catch {
          // 조회 실패 시 구매 불가능
          return false;
        }
      }),
    );

    // 4. 개수 집계
    const availableItems = availabilityResults.filter(
      (isAvailable) => isAvailable,
    ).length;
    const unavailableItems = totalItems - availableItems;

    return this.cartMapper.toCartItemCountDto(
      userId,
      totalItems,
      availableItems,
      unavailableItems,
    );
  }
}
