import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Cart 도메인 예외 기본 클래스
 */
export class CartDomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}

/**
 * C002: 장바구니 항목을 찾을 수 없음
 */
export class CartItemNotFoundException extends CartDomainException {
  constructor(cartItemId?: number) {
    super(
      'C002',
      cartItemId
        ? `Cart item with ID ${cartItemId} not found`
        : 'Cart item not found',
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * C003: 해당 장바구니 항목에 접근 권한이 없음
 */
export class CartItemAccessDeniedException extends CartDomainException {
  constructor(cartItemId?: number) {
    super(
      'C003',
      cartItemId
        ? `Access denied to cart item with ID ${cartItemId}`
        : 'Access denied to cart item',
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * C009: 유효하지 않은 수량 (1~99)
 */
export class InvalidQuantityException extends CartDomainException {
  constructor(quantity?: number) {
    super(
      'C009',
      quantity !== undefined
        ? `Invalid quantity: ${quantity}. Quantity must be between 1 and 99`
        : 'Invalid quantity. Quantity must be between 1 and 99',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * C010: 장바구니 최대 항목 수(20개) 초과
 */
export class CartItemLimitExceededException extends CartDomainException {
  constructor() {
    super(
      'C010',
      'Maximum cart item limit (20) exceeded',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * C011: 처리할 항목이 없음
 */
export class CartItemIdsEmptyException extends CartDomainException {
  constructor() {
    super('C011', 'Cart item IDs cannot be empty', HttpStatus.BAD_REQUEST);
  }
}
