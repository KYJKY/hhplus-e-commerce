import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * PAY002: 주문을 찾을 수 없음
 */
export class OrderNotFoundException extends HttpException {
  constructor(orderId: number) {
    super(
      {
        errorCode: 'PAY002',
        message: 'ORDER_NOT_FOUND',
        detail: `Order with ID ${orderId} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * PAY003: 결제를 찾을 수 없음
 */
export class PaymentNotFoundException extends HttpException {
  constructor(paymentId: number) {
    super(
      {
        errorCode: 'PAY003',
        message: 'PAYMENT_NOT_FOUND',
        detail: `Payment with ID ${paymentId} not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * PAY004: 해당 결제에 접근 권한이 없음
 */
export class PaymentAccessDeniedException extends HttpException {
  constructor(paymentId: number) {
    super(
      {
        errorCode: 'PAY004',
        message: 'PAYMENT_ACCESS_DENIED',
        detail: `Access denied to payment with ID ${paymentId}`,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * PAY005: 포인트 잔액 부족
 */
export class InsufficientBalanceException extends HttpException {
  constructor(currentBalance: number, requiredAmount: number) {
    super(
      {
        errorCode: 'PAY005',
        message: 'INSUFFICIENT_BALANCE',
        detail: `Insufficient balance. Current: ${currentBalance}, Required: ${requiredAmount}`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * PAY006: 유효하지 않은 결제 금액
 */
export class InvalidPaymentAmountException extends HttpException {
  constructor(amount: number) {
    super(
      {
        errorCode: 'PAY006',
        message: 'INVALID_PAYMENT_AMOUNT',
        detail: `Invalid payment amount: ${amount}. Must be at least 1`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * PAY007: 유효하지 않은 충전 금액 (1,000~1,000,000원)
 */
export class InvalidChargeAmountException extends HttpException {
  constructor(amount: number) {
    super(
      {
        errorCode: 'PAY007',
        message: 'INVALID_CHARGE_AMOUNT',
        detail: `Invalid charge amount: ${amount}. Must be between 1,000 and 1,000,000`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * PAY008: 충전 금액이 1,000원 단위가 아님
 */
export class ChargeAmountUnitErrorException extends HttpException {
  constructor(amount: number) {
    super(
      {
        errorCode: 'PAY008',
        message: 'CHARGE_AMOUNT_UNIT_ERROR',
        detail: `Charge amount ${amount} must be in units of 1,000`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * PAY009: 최대 보유 가능 포인트 초과
 */
export class MaxBalanceExceededException extends HttpException {
  constructor(currentBalance: number, chargeAmount: number, maxBalance: number = 10000000) {
    super(
      {
        errorCode: 'PAY009',
        message: 'MAX_BALANCE_EXCEEDED',
        detail: `Maximum balance exceeded. Current: ${currentBalance}, Charge: ${chargeAmount}, Max: ${maxBalance}`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * PAY010: 이미 결제된 주문
 */
export class DuplicatePaymentException extends HttpException {
  constructor(orderId: number) {
    super(
      {
        errorCode: 'PAY010',
        message: 'DUPLICATE_PAYMENT',
        detail: `Order ${orderId} has already been paid`,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * PAY011: 결제 처리 중 오류 발생
 */
export class PaymentProcessingErrorException extends HttpException {
  constructor(reason: string) {
    super(
      {
        errorCode: 'PAY011',
        message: 'PAYMENT_PROCESSING_ERROR',
        detail: `Payment processing error: ${reason}`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * PAY012: 이미 환불된 결제
 */
export class AlreadyRefundedException extends HttpException {
  constructor(paymentId: number) {
    super(
      {
        errorCode: 'PAY012',
        message: 'ALREADY_REFUNDED',
        detail: `Payment ${paymentId} has already been refunded`,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * PAY013: 유효하지 않은 환불 금액
 */
export class InvalidRefundAmountException extends HttpException {
  constructor(requestedAmount: number, originalAmount: number) {
    super(
      {
        errorCode: 'PAY013',
        message: 'INVALID_REFUND_AMOUNT',
        detail: `Invalid refund amount: ${requestedAmount}. Original payment: ${originalAmount}`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * PAY014: 유효하지 않은 금액
 */
export class InvalidAmountException extends HttpException {
  constructor(amount: number) {
    super(
      {
        errorCode: 'PAY014',
        message: 'INVALID_AMOUNT',
        detail: `Invalid amount: ${amount}. Must be at least 1`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * PAY015: 유효하지 않은 날짜 범위
 */
export class InvalidDateRangeException extends HttpException {
  constructor(startDate: string, endDate: string) {
    super(
      {
        errorCode: 'PAY015',
        message: 'INVALID_DATE_RANGE',
        detail: `Invalid date range: ${startDate} to ${endDate}`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
