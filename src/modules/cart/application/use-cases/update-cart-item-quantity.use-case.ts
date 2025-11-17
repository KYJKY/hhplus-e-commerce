import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { ProductQueryService } from '../../../product/domain/services/product-query.service';
import { CartMapper } from '../mappers/cart.mapper';
import { UpdatedCartItemQuantityDto } from '../dtos';

/**
 * FR-C-003: 장바구니 항목 수량 수정 Use Case
 *
 * 비즈니스 흐름:
 * 1. 장바구니 항목 조회 및 권한 확인
 * 2. 새로운 수량에 대한 재고 확인
 * 3. 수량 업데이트
 *
 * 비즈니스 규칙:
 * - 수량 범위: 1~99
 * - 재고 부족 시 수정 불가
 * - 소유자만 수정 가능
 */
@Injectable()
export class UpdateCartItemQuantityUseCase {
  constructor(
    private readonly cartDomainService: CartDomainService,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly productQueryService: ProductQueryService,
    private readonly cartMapper: CartMapper,
  ) {}

  async execute(
    userId: number,
    cartItemId: number,
    quantity: number,
  ): Promise<UpdatedCartItemQuantityDto> {
    // 1. 장바구니 항목 조회 및 권한 확인 (Domain Service에서 처리)
    const cartItem = await this.cartDomainService.findCartItemWithAuthorization(
      userId,
      cartItemId,
    );

    const previousQuantity = cartItem.quantity;

    // 2. 재고 확인
    const stockCheck = await this.inventoryDomainService.checkStock(
      cartItem.productOptionId,
      quantity,
    );

    if (!stockCheck.isAvailable) {
      throw new Error('INSUFFICIENT_STOCK'); // InsufficientStockException이 던져질 것
    }

    // 3. 수량 업데이트 (Domain Service에서 권한 재확인)
    const updatedCartItem = await this.cartDomainService.updateCartItemQuantity(
      userId,
      cartItemId,
      quantity,
    );

    // 4. 가격 정보 조회
    const optionDetail = await this.productQueryService.getProductOptionDetail(
      updatedCartItem.productId,
      updatedCartItem.productOptionId,
    );

    return this.cartMapper.toUpdatedCartItemQuantityDto(
      updatedCartItem,
      previousQuantity,
      optionDetail.price,
    );
  }
}
