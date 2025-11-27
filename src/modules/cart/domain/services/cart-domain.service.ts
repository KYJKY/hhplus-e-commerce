import { Inject, Injectable } from '@nestjs/common';
import { CartItem } from '../entities/cart-item.entity';
import type { ICartItemRepository } from '../repositories/cart-item.repository.interface';
import {
  CartItemNotFoundException,
  CartItemAccessDeniedException,
  CartItemLimitExceededException,
  CartItemIdsEmptyException,
  InvalidQuantityException,
} from '../exceptions';

/**
 * Cart Domain Service
 *
 * Domain Layer의 비즈니스 로직을 담당
 * - Repository와 직접 상호작용
 * - 도메인 규칙 강제 (최대 20개, 수량 1~99)
 * - Use Case에서 호출됨
 */
@Injectable()
export class CartDomainService {
  private static readonly MAX_CART_ITEMS = 20;

  constructor(
    @Inject('ICartItemRepository')
    private readonly cartItemRepository: ICartItemRepository,
  ) {}

  /**
   * 장바구니 항목 조회 (존재 확인 포함)
   */
  async findCartItemById(cartItemId: number): Promise<CartItem> {
    const cartItem = await this.cartItemRepository.findById(cartItemId);
    if (!cartItem || cartItem.isDeleted()) {
      throw new CartItemNotFoundException(cartItemId);
    }
    return cartItem;
  }

  /**
   * 장바구니 항목 조회 및 권한 확인
   */
  async findCartItemWithAuthorization(
    userId: number,
    cartItemId: number,
  ): Promise<CartItem> {
    const cartItem = await this.findCartItemById(cartItemId);

    if (!cartItem.isOwnedBy(userId)) {
      throw new CartItemAccessDeniedException(cartItemId);
    }

    return cartItem;
  }

  /**
   * 사용자의 장바구니 항목 목록 조회
   */
  async findCartItemsByUserId(userId: number): Promise<CartItem[]> {
    return await this.cartItemRepository.findByUserId(userId);
  }

  /**
   * 여러 장바구니 항목 조회 및 권한 확인
   */
  async findCartItemsByIdsWithAuthorization(
    userId: number,
    cartItemIds: number[],
  ): Promise<CartItem[]> {
    if (cartItemIds.length === 0) {
      throw new CartItemIdsEmptyException();
    }

    const cartItems = await this.cartItemRepository.findByIds(cartItemIds);

    // 모든 항목의 소유권 확인
    for (const cartItem of cartItems) {
      if (!cartItem.isOwnedBy(userId)) {
        throw new CartItemAccessDeniedException(cartItem.id);
      }
    }

    return cartItems;
  }

  /**
   * 사용자와 옵션으로 장바구니 항목 조회
   */
  async findCartItemByUserAndOption(
    userId: number,
    optionId: number,
  ): Promise<CartItem | null> {
    return await this.cartItemRepository.findByUserAndOption(userId, optionId);
  }

  /**
   * 장바구니 항목 추가 가능 여부 확인 (최대 20개 제한)
   */
  async validateCartItemLimit(userId: number): Promise<void> {
    const currentCount = await this.cartItemRepository.countByUserId(userId);
    if (currentCount >= CartDomainService.MAX_CART_ITEMS) {
      throw new CartItemLimitExceededException();
    }
  }

  /**
   * 장바구니 항목 생성
   */
  async createCartItem(createData: {
    userId: number;
    productId: number;
    productOptionId: number;
    quantity: number;
  }): Promise<CartItem> {
    // 장바구니 제한 확인
    await this.validateCartItemLimit(createData.userId);

    // CartItem 엔티티 생성 (검증 포함)
    const newCartItem = CartItem.create({
      id: 0, // Repository에서 자동 생성
      userId: createData.userId,
      productId: createData.productId,
      productOptionId: createData.productOptionId,
      quantity: createData.quantity,
      createdAt: new Date().toISOString(),
    });

    // Repository를 통해 생성
    return await this.cartItemRepository.save(newCartItem);
  }

  /**
   * 장바구니 항목 수량 수정 (권한 확인 포함)
   */
  async updateCartItemQuantity(
    userId: number,
    cartItemId: number,
    newQuantity: number,
  ): Promise<CartItem> {
    // 장바구니 항목 조회 및 권한 확인
    const cartItem = await this.findCartItemWithAuthorization(
      userId,
      cartItemId,
    );

    // 수량 변경 (Entity의 비즈니스 로직 활용)
    cartItem.updateQuantity(newQuantity);

    // Repository를 통해 업데이트
    return await this.cartItemRepository.update(cartItemId, cartItem);
  }

  /**
   * 장바구니 항목 수량 증가 (동일 옵션 추가 시)
   */
  async increaseCartItemQuantity(
    cartItem: CartItem,
    additionalQuantity: number,
  ): Promise<CartItem> {
    if (additionalQuantity <= 0) {
      throw new InvalidQuantityException(additionalQuantity);
    }

    // 수량 증가 (Entity의 비즈니스 로직 활용)
    cartItem.increaseQuantity(additionalQuantity);

    // Repository를 통해 업데이트
    return await this.cartItemRepository.update(cartItem.id, cartItem);
  }

  /**
   * 장바구니 항목 삭제 (권한 확인 포함)
   */
  async deleteCartItem(userId: number, cartItemId: number): Promise<void> {
    // 장바구니 항목 조회 및 권한 확인
    await this.findCartItemWithAuthorization(userId, cartItemId);

    // Repository를 통해 삭제 (논리적 삭제)
    await this.cartItemRepository.delete(cartItemId);
  }

  /**
   * 여러 장바구니 항목 삭제 (권한 확인 포함)
   */
  async deleteCartItemsByIds(
    userId: number,
    cartItemIds: number[],
  ): Promise<number> {
    if (cartItemIds.length === 0) {
      throw new CartItemIdsEmptyException();
    }

    // 권한 확인
    await this.findCartItemsByIdsWithAuthorization(userId, cartItemIds);

    // Repository를 통해 삭제 (논리적 삭제)
    return await this.cartItemRepository.deleteByIds(cartItemIds);
  }

  /**
   * 주문 완료 후 주문 항목과 일치하는 장바구니 항목 삭제
   *
   * @param userId - 사용자 ID
   * @param orderItems - 주문 항목 목록 (productOptionId, quantity)
   * @returns 삭제된 항목 수
   */
  async deleteCartItemsByOrderItems(
    userId: number,
    orderItems: Array<{ productOptionId: number; quantity: number }>,
  ): Promise<number> {
    // 1. 사용자의 장바구니 조회
    const cartItems = await this.findCartItemsByUserId(userId);

    // 2. 주문 항목과 일치하는 장바구니 항목 찾기
    const cartItemIds = orderItems
      .map(
        (orderItem) =>
          cartItems.find(
            (ci) =>
              ci.productOptionId === orderItem.productOptionId &&
              ci.quantity === orderItem.quantity,
          )?.id,
      )
      .filter((id): id is number => id !== undefined);

    // 3. 삭제 (빈 배열이면 0 반환)
    if (cartItemIds.length === 0) {
      return 0;
    }

    return await this.deleteCartItemsByIds(userId, cartItemIds);
  }

  /**
   * 사용자의 모든 장바구니 항목 삭제
   */
  async deleteAllCartItems(userId: number): Promise<number> {
    // Repository를 통해 삭제 (논리적 삭제)
    return await this.cartItemRepository.deleteAllByUserId(userId);
  }

  /**
   * 장바구니 항목 개수 조회
   */
  async countCartItems(userId: number): Promise<number> {
    return await this.cartItemRepository.countByUserId(userId);
  }

  /**
   * 장바구니 항목 존재 여부 확인
   */
  async existsCartItem(cartItemId: number): Promise<boolean> {
    return await this.cartItemRepository.exists(cartItemId);
  }

  /**
   * 장바구니 최대 개수 조회
   */
  static getMaxCartItems(): number {
    return CartDomainService.MAX_CART_ITEMS;
  }
}
