import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';
import { ProductQueryService } from '../../../product/domain/services/product-query.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';

/**
 * FR-C-009: 장바구니 항목 유효성 검증 Use Case
 *
 * 비즈니스 흐름:
 * 1. 사용자 존재 확인
 * 2. 지정된 장바구니 항목 조회 및 권한 확인
 * 3. 각 항목의 상품/옵션 존재 여부 확인
 * 4. 각 항목의 재고 및 판매 가능 상태 확인
 * 5. 유효성 검증 결과 반환
 *
 * 비즈니스 규칙:
 * - 모든 항목이 유효한 경우에만 isValid=true
 * - 주문 생성 전 반드시 호출되어야 함
 * - 재고 부족, 판매 종료, 상품 삭제 등을 모두 검증
 */
@Injectable()
export class ValidateCartItemsUseCase {
  constructor(
    private readonly cartDomainService: CartDomainService,
    private readonly productQueryService: ProductQueryService,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(
    userId: number,
    cartItemIds: number[],
  ): Promise<ValidateCartItemsResponseDto> {
    // 1. 사용자 존재 확인
    await this.userDomainService.findUserById(userId);

    // 2. 지정된 장바구니 항목 조회 및 권한 확인
    const cartItems =
      await this.cartDomainService.findCartItemsByIdsWithAuthorization(
        userId,
        cartItemIds,
      );

    // 3. 각 항목의 유효성 검증
    const validationResults = await Promise.all(
      cartItems.map(async (cartItem) => {
        const errors: string[] = [];
        let isValid = true;
        let price = 0;

        try {
          // 상품 옵션 상세 조회
          const optionDetail =
            await this.productQueryService.getProductOptionDetail(
              cartItem.productId,
              cartItem.productOptionId,
            );

          price = optionDetail.price;

          // 판매 가능 상태 확인
          if (!optionDetail.isAvailable) {
            errors.push('판매 종료');
            isValid = false;
          }

          // 재고 확인
          const stockCheck = await this.inventoryDomainService.checkStock(
            cartItem.productOptionId,
            cartItem.quantity,
          );

          if (!stockCheck.isAvailable) {
            errors.push(
              `재고 부족 (요청: ${cartItem.quantity}, 재고: ${stockCheck.currentStock})`,
            );
            isValid = false;
          }

          return {
            cartItemId: cartItem.id,
            optionId: cartItem.productOptionId,
            productName: optionDetail.productName,
            optionName: optionDetail.optionName,
            quantity: cartItem.quantity,
            price,
            isValid,
            errors,
          };
        } catch (error) {
          // 상품이나 옵션을 찾을 수 없는 경우
          errors.push('상품 또는 옵션이 존재하지 않음');
          isValid = false;

          return {
            cartItemId: cartItem.id,
            optionId: cartItem.productOptionId,
            productName: '알 수 없음',
            optionName: '알 수 없음',
            quantity: cartItem.quantity,
            price: 0,
            isValid,
            errors,
          };
        }
      }),
    );

    // 4. 전체 유효성 여부 결정 (모든 항목이 유효해야 함)
    const isValid = validationResults.every((result) => result.isValid);

    return {
      isValid,
      items: validationResults,
    };
  }
}

/**
 * Response DTO (임시 타입 - Presentation Layer에서 정의될 예정)
 */
interface ValidateCartItemsResponseDto {
  isValid: boolean;
  items: Array<{
    cartItemId: number;
    optionId: number;
    productName: string;
    optionName: string;
    quantity: number;
    price: number;
    isValid: boolean;
    errors: string[];
  }>;
}
