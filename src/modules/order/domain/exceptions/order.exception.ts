import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Order 도메인 예외 기본 클래스
 */
export class OrderDomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}

/**
 * O001: USER_NOT_FOUND
 */
export class UserNotFoundException extends OrderDomainException {
  constructor(userId: number) {
    super('O001', `User not found: ${userId}`, HttpStatus.NOT_FOUND);
  }
}

/**
 * O002: ORDER_NOT_FOUND
 */
export class OrderNotFoundException extends OrderDomainException {
  constructor(orderId: number) {
    super('O002', `Order not found: ${orderId}`, HttpStatus.NOT_FOUND);
  }
}

/**
 * O003: ORDER_ACCESS_DENIED
 */
export class OrderAccessDeniedException extends OrderDomainException {
  constructor(orderId: number, userId: number) {
    super(
      'O003',
      `Access denied to order ${orderId} for user ${userId}`,
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * O004: CART_ITEM_NOT_FOUND
 */
export class CartItemNotFoundException extends OrderDomainException {
  constructor(cartItemId: number) {
    super('O004', `Cart item not found: ${cartItemId}`, HttpStatus.NOT_FOUND);
  }
}

/**
 * O005: CART_ITEM_IDS_EMPTY
 */
export class CartItemIdsEmptyException extends OrderDomainException {
  constructor() {
    super('O005', 'Cart item IDs cannot be empty', HttpStatus.BAD_REQUEST);
  }
}

/**
 * O006: ADDRESS_NOT_FOUND
 */
export class AddressNotFoundException extends OrderDomainException {
  constructor(addressId: number) {
    super('O006', `Address not found: ${addressId}`, HttpStatus.NOT_FOUND);
  }
}

/**
 * O007: ADDRESS_ACCESS_DENIED
 */
export class AddressAccessDeniedException extends OrderDomainException {
  constructor(addressId: number, userId: number) {
    super(
      'O007',
      `Access denied to address ${addressId} for user ${userId}`,
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * O008: OPTION_NOT_FOUND
 */
export class OptionNotFoundException extends OrderDomainException {
  constructor(optionId: number) {
    super(
      'O008',
      `Product option not found: ${optionId}`,
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * O009: OPTION_NOT_AVAILABLE
 */
export class OptionNotAvailableException extends OrderDomainException {
  constructor(optionId: number) {
    super(
      'O009',
      `Product option not available: ${optionId}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * O010: INSUFFICIENT_STOCK
 */
export class InsufficientStockException extends OrderDomainException {
  constructor(optionId: number, requested: number, available: number) {
    super(
      'O010',
      `Insufficient stock for option ${optionId}. Requested: ${requested}, Available: ${available}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * O011: INVALID_COUPON
 */
export class InvalidCouponException extends OrderDomainException {
  constructor(couponId: number) {
    super('O011', `Invalid coupon: ${couponId}`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * O012: COUPON_EXPIRED
 */
export class CouponExpiredException extends OrderDomainException {
  constructor(couponId: number) {
    super('O012', `Coupon expired: ${couponId}`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * O013: COUPON_ALREADY_USED
 */
export class CouponAlreadyUsedException extends OrderDomainException {
  constructor(userCouponId: number) {
    super(
      'O013',
      `Coupon already used: ${userCouponId}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * O014: COUPON_NOT_OWNED
 */
export class CouponNotOwnedException extends OrderDomainException {
  constructor(userCouponId: number, userId: number) {
    super(
      'O014',
      `User ${userId} does not own user coupon ${userCouponId}`,
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * O015: INVALID_ORDER_STATUS
 */
export class InvalidOrderStatusException extends OrderDomainException {
  constructor(orderId: number, currentStatus: string, expectedStatus?: string) {
    const message = expectedStatus
      ? `Invalid order status for order ${orderId}. Current: ${currentStatus}, Expected: ${expectedStatus}`
      : `Invalid order status for order ${orderId}: ${currentStatus}`;
    super('O015', message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * O016: INVALID_STATUS_TRANSITION
 */
export class InvalidStatusTransitionException extends OrderDomainException {
  constructor(orderId: number, fromStatus: string, toStatus: string) {
    super(
      'O016',
      `Invalid status transition for order ${orderId}: ${fromStatus} → ${toStatus}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * O017: INSUFFICIENT_BALANCE
 */
export class InsufficientBalanceException extends OrderDomainException {
  constructor(userId: number, required: number, available: number) {
    super(
      'O017',
      `Insufficient balance for user ${userId}. Required: ${required}, Available: ${available}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * O018: PAYMENT_FAILED
 */
export class PaymentFailedException extends OrderDomainException {
  constructor(orderId: number, reason: string) {
    super(
      'O018',
      `Payment failed for order ${orderId}: ${reason}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * O019: ORDER_CANNOT_BE_CANCELLED
 */
export class OrderCannotBeCancelledException extends OrderDomainException {
  constructor(orderId: number, currentStatus: string) {
    super(
      'O019',
      `Order ${orderId} cannot be cancelled. Current status: ${currentStatus}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * O020: STOCK_DEDUCTION_FAILED
 */
export class StockDeductionFailedException extends OrderDomainException {
  constructor(orderId: number, reason: string) {
    super(
      'O020',
      `Stock deduction failed for order ${orderId}: ${reason}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * O021: EXTERNAL_API_ERROR
 */
export class ExternalApiErrorException extends OrderDomainException {
  constructor(orderId: number, reason: string) {
    super(
      'O021',
      `External API error for order ${orderId}: ${reason}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
