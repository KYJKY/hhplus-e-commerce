import { Injectable } from '@nestjs/common';
import { CartItem } from '../../domain/entities/cart-item.entity';
import {
  CartItemDto,
  CartDto,
  CartItemCountDto,
  CartStockItemDto,
  CartStockCheckDto,
  AddedCartItemDto,
  UpdatedCartItemQuantityDto,
  DeletedCartItemDto,
  ClearedCartDto,
  DeletedSelectedCartItemsDto,
  ValidatedCartItemDto,
  ValidatedCartItemsDto,
  ConvertedCartToOrderDto,
} from '../dtos';

/**
 * Cart Mapper
 *
 * Domain Entity ↔ Application DTO 변환
 * Presentation Layer와 Domain Layer를 격리
 */
@Injectable()
export class CartMapper {
  /**
   * CartItem Entity → CartItemDto (기본 정보만)
   *
   * 주의: Product 정보는 Use Case에서 추가로 조합해야 함
   */
  toCartItemDto(
    cartItem: CartItem,
    productInfo: {
      productName: string;
      thumbnailUrl: string | null;
      optionName: string;
      price: number;
      stockQuantity: number;
      isAvailable: boolean;
    },
  ): CartItemDto {
    return new CartItemDto(
      cartItem.id,
      cartItem.userId,
      cartItem.productId,
      productInfo.productName,
      productInfo.thumbnailUrl,
      cartItem.productOptionId,
      productInfo.optionName,
      productInfo.price,
      cartItem.quantity,
      productInfo.price * cartItem.quantity, // subtotal 계산
      productInfo.stockQuantity,
      productInfo.isAvailable,
      cartItem.createdAt,
    );
  }

  /**
   * CartItemDto[] → CartDto
   */
  toCartDto(userId: number, items: CartItemDto[]): CartDto {
    const totalItems = items.length;
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return new CartDto(userId, items, totalItems, totalAmount);
  }

  /**
   * 장바구니 아이템 개수 정보 생성
   */
  toCartItemCountDto(
    userId: number,
    totalItems: number,
    availableItems: number,
    unavailableItems: number,
  ): CartItemCountDto {
    return new CartItemCountDto(
      userId,
      totalItems,
      availableItems,
      unavailableItems,
    );
  }

  /**
   * 재고 확인 아이템 정보 생성
   */
  toCartStockItemDto(
    cartItemId: number,
    optionId: number,
    productName: string,
    optionName: string,
    requestedQuantity: number,
    stockQuantity: number,
    isAvailable: boolean,
    reason: string | null,
  ): CartStockItemDto {
    return new CartStockItemDto(
      cartItemId,
      optionId,
      productName,
      optionName,
      requestedQuantity,
      stockQuantity,
      isAvailable,
      reason,
    );
  }

  /**
   * 재고 확인 결과 생성
   */
  toCartStockCheckDto(items: CartStockItemDto[]): CartStockCheckDto {
    const availableCount = items.filter((item) => item.isAvailable).length;
    const unavailableCount = items.filter((item) => !item.isAvailable).length;

    return new CartStockCheckDto(items, availableCount, unavailableCount);
  }

  /**
   * 장바구니 항목 추가 결과 생성
   */
  toAddedCartItemDto(
    cartItem: CartItem,
    productInfo: {
      productId: number;
      productName: string;
      optionName: string;
      price: number;
    },
  ): AddedCartItemDto {
    return new AddedCartItemDto(
      cartItem.id,
      productInfo.productId,
      productInfo.productName,
      cartItem.productOptionId,
      productInfo.optionName,
      productInfo.price,
      cartItem.quantity,
      cartItem.createdAt,
    );
  }

  /**
   * 장바구니 항목 수량 수정 결과 생성
   */
  toUpdatedCartItemQuantityDto(
    cartItem: CartItem,
    previousQuantity: number,
    price: number,
  ): UpdatedCartItemQuantityDto {
    return new UpdatedCartItemQuantityDto(
      cartItem.id,
      cartItem.productOptionId,
      previousQuantity,
      cartItem.quantity,
      price,
      price * cartItem.quantity,
      cartItem.updatedAt || new Date().toISOString(),
    );
  }

  /**
   * 장바구니 항목 삭제 결과 생성
   */
  toDeletedCartItemDto(cartItemId: number): DeletedCartItemDto {
    return new DeletedCartItemDto(true, cartItemId);
  }

  /**
   * 장바구니 전체 삭제 결과 생성
   */
  toClearedCartDto(deletedCount: number): ClearedCartDto {
    return new ClearedCartDto(true, deletedCount);
  }

  /**
   * 장바구니 선택 항목 삭제 결과 생성
   */
  toDeletedSelectedCartItemsDto(
    deletedCount: number,
    cartItemIds: number[],
  ): DeletedSelectedCartItemsDto {
    return new DeletedSelectedCartItemsDto(
      true,
      deletedCount,
      cartItemIds.slice(0, deletedCount),
    );
  }

  /**
   * 장바구니 항목 유효성 검증 결과 생성 (개별)
   */
  toValidatedCartItemDto(
    cartItemId: number,
    optionId: number,
    productName: string,
    optionName: string,
    quantity: number,
    price: number,
    isValid: boolean,
    errors: string[],
  ): ValidatedCartItemDto {
    return new ValidatedCartItemDto(
      cartItemId,
      optionId,
      productName,
      optionName,
      quantity,
      price,
      isValid,
      errors,
    );
  }

  /**
   * 장바구니 항목 유효성 검증 결과 생성 (전체)
   */
  toValidatedCartItemsDto(
    items: ValidatedCartItemDto[],
  ): ValidatedCartItemsDto {
    const isValid = items.every((item) => item.isValid);
    return new ValidatedCartItemsDto(isValid, items);
  }

  /**
   * 장바구니 → 주문 전환 결과 생성
   */
  toConvertedCartToOrderDto(
    deletedCount: number,
    orderId: number,
  ): ConvertedCartToOrderDto {
    return new ConvertedCartToOrderDto(true, deletedCount, orderId);
  }
}
