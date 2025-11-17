import { Injectable } from '@nestjs/common';
import { CartDomainService } from '../../domain/services/cart-domain.service';
import { ProductQueryService } from '../../../product/domain/services/product-query.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import {
  ProductNotFoundException,
  ProductDeletedException,
  OptionNotFoundException,
} from '../../../product/domain/exceptions';
import { CartMapper } from '../mappers/cart.mapper';
import { AddedCartItemDto } from '../dtos';

/**
 * FR-C-002: 장바구니 항목 추가 Use Case
 *
 * 비즈니스 흐름:
 * 1. 사용자 존재 확인
 * 2. 상품 옵션 존재 및 판매 가능 여부 확인
 * 3. 재고 확인
 * 4. 동일 옵션 존재 시 수량 증가, 없으면 신규 생성
 * 5. 장바구니 최대 개수 제한 확인 (최대 20개)
 *
 * 비즈니스 규칙:
 * - 동일 옵션이 이미 있으면 수량 증가
 * - 재고 부족 시 추가 불가
 * - 판매 불가능한 옵션은 추가 불가
 * - 장바구니 최대 20개 제한
 */
@Injectable()
export class AddCartItemUseCase {
  constructor(
    private readonly cartDomainService: CartDomainService,
    private readonly productQueryService: ProductQueryService,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly userDomainService: UserDomainService,
    private readonly cartMapper: CartMapper,
  ) {}

  async execute(
    userId: number,
    optionId: number,
    quantity: number,
  ): Promise<AddedCartItemDto> {
    // 1. 사용자 존재 확인
    await this.userDomainService.findUserById(userId);

    // 2. 상품 옵션 상세 조회 (존재 여부 및 판매 가능 여부 확인)
    // 옵션 조회 시 productId가 필요하지만, 우선 옵션만 조회하여 productId를 얻음
    let productId: number;
    let optionDetail: {
      optionId: number;
      productId: number;
      productName: string;
      optionName: string;
      price: number;
      isAvailable: boolean;
    };

    try {
      // Product 모듈에서 옵션 정보를 얻기 위해 우회적인 방법 사용
      // 모든 상품을 순회하면서 옵션을 찾는 것은 비효율적이므로
      // Repository 직접 접근이 필요할 수 있으나, 일단 재고 확인으로 우회
      const stockCheck = await this.inventoryDomainService.checkStock(
        optionId,
        quantity,
      );

      productId = stockCheck.productId;
      optionDetail = {
        optionId: stockCheck.optionId,
        productId: stockCheck.productId,
        productName: stockCheck.productName,
        optionName: stockCheck.optionName,
        price: 0, // checkStock에는 price 정보가 없음
        isAvailable: stockCheck.isAvailable,
      };

      // 상세 정보 조회
      const fullDetail = await this.productQueryService.getProductOptionDetail(
        productId,
        optionId,
      );

      optionDetail.price = fullDetail.price;
      optionDetail.isAvailable = fullDetail.isAvailable;
    } catch (error) {
      // 옵션을 찾을 수 없거나 상품이 삭제된 경우
      if (
        error instanceof OptionNotFoundException ||
        error instanceof ProductNotFoundException ||
        error instanceof ProductDeletedException
      ) {
        throw error;
      }
      throw error;
    }

    // 판매 불가능한 옵션 체크
    if (!optionDetail.isAvailable) {
      throw new Error('OPTION_NOT_AVAILABLE'); // TODO: 적절한 도메인 예외로 교체
    }

    // 3. 재고 확인
    const stockCheck = await this.inventoryDomainService.checkStock(
      optionId,
      quantity,
    );

    if (!stockCheck.isAvailable) {
      throw new Error('INSUFFICIENT_STOCK'); // InsufficientStockException이 던져질 것
    }

    // 4. 동일 옵션 존재 여부 확인
    const existingCartItem =
      await this.cartDomainService.findCartItemByUserAndOption(
        userId,
        optionId,
      );

    let cartItem;

    if (existingCartItem) {
      // 동일 옵션이 이미 존재 - 수량 증가
      cartItem = await this.cartDomainService.increaseCartItemQuantity(
        existingCartItem,
        quantity,
      );
    } else {
      // 신규 장바구니 항목 생성 (내부적으로 최대 개수 확인)
      cartItem = await this.cartDomainService.createCartItem({
        userId,
        productId: optionDetail.productId,
        productOptionId: optionId,
        quantity,
      });
    }

    return this.cartMapper.toAddedCartItemDto(cartItem, {
      productId: optionDetail.productId,
      productName: optionDetail.productName,
      optionName: optionDetail.optionName,
      price: optionDetail.price,
    });
  }
}
