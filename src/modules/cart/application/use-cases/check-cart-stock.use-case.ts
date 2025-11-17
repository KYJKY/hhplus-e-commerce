import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';
import { ProductQueryService } from '../../../product/domain/services/product-query.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { CartMapper } from '../mappers/cart.mapper';
import { CartStockCheckDto } from '../dtos';

/**
 * FR-C-007: 장바구니 재고 확인 Use Case
 *
 * 비즈니스 흐름:
 * 1. 사용자 존재 확인
 * 2. 사용자의 장바구니 항목 조회
 * 3. 각 항목의 재고 및 판매 가능 상태 확인
 * 4. 구매 가능/불가능 항목 분류
 *
 * 비즈니스 규칙:
 * - 재고 부족 시 isAvailable=false
 * - 판매 종료된 상품/옵션도 isAvailable=false
 * - 삭제된 상품은 자동으로 불가능 처리
 */
@Injectable()
export class CheckCartStockUseCase {
  constructor(
    private readonly cartDomainService: CartDomainService,
    private readonly productQueryService: ProductQueryService,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly userDomainService: UserDomainService,
    private readonly cartMapper: CartMapper,
  ) {}

  async execute(userId: number): Promise<CartStockCheckDto> {
    // 1. 사용자 존재 확인
    await this.userDomainService.findUserById(userId);

    // 2. 사용자의 장바구니 항목 조회
    const cartItems =
      await this.cartDomainService.findCartItemsByUserId(userId);

    // 3. 각 항목의 재고 및 판매 가능 상태 확인
    const itemsWithStockStatus = await Promise.all(
      cartItems.map(async (cartItem) => {
        try {
          // 재고 확인
          const stockCheck = await this.inventoryDomainService.checkStock(
            cartItem.productOptionId,
            cartItem.quantity,
          );

          // 옵션 상세 조회 (판매 가능 상태 확인)
          const optionDetail =
            await this.productQueryService.getProductOptionDetail(
              cartItem.productId,
              cartItem.productOptionId,
            );

          // 구매 가능 여부 판단
          const isAvailable =
            stockCheck.isAvailable && optionDetail.isAvailable;

          // 불가능 사유 결정
          let reason: string | null = null;
          if (!isAvailable) {
            if (!stockCheck.isAvailable) {
              reason = '재고 부족';
            } else if (!optionDetail.isAvailable) {
              reason = '판매 종료';
            }
          }

          return this.cartMapper.toCartStockItemDto(
            cartItem.id,
            cartItem.productOptionId,
            stockCheck.productName,
            stockCheck.optionName,
            cartItem.quantity,
            stockCheck.currentStock,
            isAvailable,
            reason,
          );
        } catch {
          // 삭제되었거나 조회할 수 없는 항목
          return this.cartMapper.toCartStockItemDto(
            cartItem.id,
            cartItem.productOptionId,
            '알 수 없음',
            '알 수 없음',
            cartItem.quantity,
            0,
            false,
            '상품 삭제됨',
          );
        }
      }),
    );

    // 4. 구매 가능/불가능 항목 개수 집계
    return this.cartMapper.toCartStockCheckDto(itemsWithStockStatus);
  }
}
