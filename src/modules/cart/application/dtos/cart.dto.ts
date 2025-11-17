/**
 * Application Layer DTO - Cart
 * Use Case의 입출력을 정의하며, Domain과 Presentation Layer를 격리
 */

import { CartItemDto } from './cart-item.dto';

/**
 * 장바구니 정보
 */
export class CartDto {
  constructor(
    public readonly userId: number,
    public readonly items: CartItemDto[],
    public readonly totalItems: number,
    public readonly totalAmount: number,
  ) {}
}

/**
 * 장바구니 아이템 개수 정보
 */
export class CartItemCountDto {
  constructor(
    public readonly userId: number,
    public readonly totalItems: number,
    public readonly availableItems: number,
    public readonly unavailableItems: number,
  ) {}
}
