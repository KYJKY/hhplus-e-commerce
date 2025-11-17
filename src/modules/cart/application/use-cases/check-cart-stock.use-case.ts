import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';
import { ProductQueryService } from '../../../product/domain/services/product-query.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';

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
  ) {}

  async execute(userId: number): Promise<CheckCartStockResponseDto> {
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

          return {
            cartItemId: cartItem.id,
            optionId: cartItem.productOptionId,
            productName: stockCheck.productName,
            optionName: stockCheck.optionName,
            requestedQuantity: cartItem.quantity,
            stockQuantity: stockCheck.currentStock,
            isAvailable,
            reason,
          };
        } catch (error) {
          // 삭제되었거나 조회할 수 없는 항목
          return {
            cartItemId: cartItem.id,
            optionId: cartItem.productOptionId,
            productName: '알 수 없음',
            optionName: '알 수 없음',
            requestedQuantity: cartItem.quantity,
            stockQuantity: 0,
            isAvailable: false,
            reason: '상품 삭제됨',
          };
        }
      }),
    );

    // 4. 구매 가능/불가능 항목 개수 집계
    const availableCount = itemsWithStockStatus.filter(
      (item) => item.isAvailable,
    ).length;
    const unavailableCount = itemsWithStockStatus.filter(
      (item) => !item.isAvailable,
    ).length;

    return {
      items: itemsWithStockStatus,
      availableCount,
      unavailableCount,
    };
  }
}

/**
 * Response DTO (임시 타입 - Presentation Layer에서 정의될 예정)
 */
interface CheckCartStockResponseDto {
  items: Array<{
    cartItemId: number;
    optionId: number;
    productName: string;
    optionName: string;
    requestedQuantity: number;
    stockQuantity: number;
    isAvailable: boolean;
    reason: string | null;
  }>;
  availableCount: number;
  unavailableCount: number;
}
