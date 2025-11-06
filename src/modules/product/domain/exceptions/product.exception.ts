import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * P001: 상품을 찾을 수 없음
 */
export class ProductNotFoundException extends HttpException {
  constructor(productId: number) {
    super(
      {
        errorCode: 'P001',
        message: 'PRODUCT_NOT_FOUND',
        detail: `Product with ID ${productId} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * P002: 삭제된 상품
 */
export class ProductDeletedException extends HttpException {
  constructor(productId: number) {
    super(
      {
        errorCode: 'P002',
        message: 'PRODUCT_DELETED',
        detail: `Product with ID ${productId} has been deleted`,
      },
      HttpStatus.GONE,
    );
  }
}

/**
 * P003: 옵션을 찾을 수 없음
 */
export class OptionNotFoundException extends HttpException {
  constructor(optionId: number) {
    super(
      {
        errorCode: 'P003',
        message: 'OPTION_NOT_FOUND',
        detail: `Option with ID ${optionId} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * P004: 옵션이 해당 상품에 속하지 않음
 */
export class OptionNotBelongToProductException extends HttpException {
  constructor(optionId: number, productId: number) {
    super(
      {
        errorCode: 'P004',
        message: 'OPTION_NOT_BELONG_TO_PRODUCT',
        detail: `Option with ID ${optionId} does not belong to Product with ID ${productId}`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * P005: 재고 부족
 */
export class InsufficientStockException extends HttpException {
  constructor(
    optionId: number,
    requestedQuantity: number,
    availableQuantity: number,
  ) {
    super(
      {
        errorCode: 'P005',
        message: 'INSUFFICIENT_STOCK',
        detail: `Insufficient stock for option ${optionId}. Requested: ${requestedQuantity}, Available: ${availableQuantity}`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * P006: 유효하지 않은 수량
 */
export class InvalidQuantityException extends HttpException {
  constructor(quantity: number) {
    super(
      {
        errorCode: 'P006',
        message: 'INVALID_QUANTITY',
        detail: `Invalid quantity: ${quantity}. Quantity must be greater than 0`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * P007: 카테고리를 찾을 수 없음
 */
export class CategoryNotFoundException extends HttpException {
  constructor(categoryId: number) {
    super(
      {
        errorCode: 'P007',
        message: 'CATEGORY_NOT_FOUND',
        detail: `Category with ID ${categoryId} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * P008: 판매 불가능한 옵션
 */
export class OptionNotAvailableException extends HttpException {
  constructor(optionId: number) {
    super(
      {
        errorCode: 'P008',
        message: 'OPTION_NOT_AVAILABLE',
        detail: `Option with ID ${optionId} is not available for purchase`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
