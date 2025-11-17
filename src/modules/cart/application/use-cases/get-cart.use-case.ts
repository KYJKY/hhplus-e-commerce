import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';
import { ProductQueryService } from '../../../product/domain/services/product-query.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';

/**
 * FR-C-001: 장바구니 조회 Use Case
 *
 * 비즈니스 흐름:
 * 1. 사용자 존재 확인
 * 2. 사용자의 장바구니 항목 조회
 * 3. 각 항목의 상품/옵션 정보 조회
 * 4. 각 항목의 재고 확인
 * 5. 총 금액 계산
 */
@Injectable()
export class GetCartUseCase {
  constructor(
    private readonly cartDomainService: CartDomainService,
    private readonly productQueryService: ProductQueryService,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(userId: number): Promise<GetCartResponseDto> {
    // 1. 사용자 존재 확인
    await this.userDomainService.findUserById(userId);

    // 2. 사용자의 장바구니 항목 조회
    const cartItems =
      await this.cartDomainService.findCartItemsByUserId(userId);

    // 3. 각 항목의 상세 정보 조회 및 재고 확인
    const itemsWithDetails = await Promise.all(
      cartItems.map(async (cartItem) => {
        try {
          // 상품 옵션 상세 조회
          const optionDetail =
            await this.productQueryService.getProductOptionDetail(
              cartItem.productId,
              cartItem.productOptionId,
            );

          // 재고 확인
          const stockCheck = await this.inventoryDomainService.checkStock(
            cartItem.productOptionId,
            cartItem.quantity,
          );

          return {
            cartItemId: cartItem.id,
            productId: cartItem.productId,
            productName: optionDetail.productName,
            thumbnailUrl: null, // 상세 조회에서는 썸네일 정보가 없으므로 null
            optionId: cartItem.productOptionId,
            optionName: optionDetail.optionName,
            price: optionDetail.price,
            quantity: cartItem.quantity,
            subtotal: optionDetail.price * cartItem.quantity,
            stockQuantity: stockCheck.currentStock,
            isAvailable: stockCheck.isAvailable && optionDetail.isAvailable,
            addedAt: cartItem.createdAt,
          };
        } catch (error) {
          // 삭제되었거나 조회할 수 없는 항목은 null 반환
          // 이후 필터링될 것
          return null;
        }
      }),
    );

    // 조회 가능한 항목만 필터링 (삭제된 상품/옵션 제외)
    const validItems = itemsWithDetails.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );

    // 4. 총 금액 계산
    const totalAmount = validItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    return {
      userId,
      items: validItems,
      totalItems: validItems.length,
      totalAmount,
    };
  }
}

/**
 * Response DTO (임시 타입 - Presentation Layer에서 정의될 예정)
 */
interface GetCartResponseDto {
  userId: number;
  items: Array<{
    cartItemId: number;
    productId: number;
    productName: string;
    thumbnailUrl: string | null;
    optionId: number;
    optionName: string;
    price: number;
    quantity: number;
    subtotal: number;
    stockQuantity: number;
    isAvailable: boolean;
    addedAt: string;
  }>;
  totalItems: number;
  totalAmount: number;
}
