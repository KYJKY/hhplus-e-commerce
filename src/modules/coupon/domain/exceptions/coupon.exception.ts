import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Coupon 도메인 예외 기본 클래스
 */
export class CouponDomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}

/**
 * CP002: 쿠폰을 찾을 수 없음
 */
export class CouponNotFoundException extends CouponDomainException {
  constructor(couponId?: number) {
    super(
      'CP002',
      couponId ? `Coupon with ID ${couponId} not found` : 'Coupon not found',
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * CP003: 사용자 쿠폰을 찾을 수 없음
 */
export class UserCouponNotFoundException extends CouponDomainException {
  constructor(userCouponId?: number) {
    super(
      'CP003',
      userCouponId
        ? `User coupon with ID ${userCouponId} not found`
        : 'User coupon not found',
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * CP004: 해당 쿠폰에 접근 권한이 없음
 */
export class CouponAccessDeniedException extends CouponDomainException {
  constructor(couponId?: number) {
    super(
      'CP004',
      couponId
        ? `Access denied to coupon with ID ${couponId}`
        : 'Access denied to coupon',
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * CP005: 비활성화된 쿠폰
 */
export class CouponNotActiveException extends CouponDomainException {
  constructor(couponId?: number) {
    super(
      'CP005',
      couponId
        ? `Coupon with ID ${couponId} is not active`
        : 'Coupon is not active',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * CP006: 이미 발급받은 쿠폰
 */
export class CouponAlreadyIssuedException extends CouponDomainException {
  constructor(couponId?: number) {
    super(
      'CP006',
      couponId
        ? `Coupon with ID ${couponId} has already been issued to this user`
        : 'Coupon has already been issued to this user',
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * CP007: 쿠폰 발급 한도 초과
 */
export class CouponIssueLimitExceededException extends CouponDomainException {
  constructor(couponId?: number) {
    super(
      'CP007',
      couponId
        ? `Coupon with ID ${couponId} has reached its issue limit`
        : 'Coupon has reached its issue limit',
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * CP008: 쿠폰 유효 기간이 시작되지 않음
 */
export class CouponNotStartedException extends CouponDomainException {
  constructor(validFrom?: string) {
    super(
      'CP008',
      validFrom
        ? `Coupon validity period has not started yet. Valid from: ${validFrom}`
        : 'Coupon validity period has not started yet',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * CP009: 쿠폰 유효 기간이 종료됨
 */
export class CouponExpiredException extends CouponDomainException {
  constructor(validUntil?: string) {
    super(
      'CP009',
      validUntil
        ? `Coupon has expired. Valid until: ${validUntil}`
        : 'Coupon has expired',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * CP010: 이미 사용된 쿠폰
 */
export class CouponAlreadyUsedException extends CouponDomainException {
  constructor(userCouponId?: number) {
    super(
      'CP010',
      userCouponId
        ? `User coupon with ID ${userCouponId} has already been used`
        : 'Coupon has already been used',
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * CP011: 최소 주문 금액 미충족
 */
export class MinOrderAmountNotMetException extends CouponDomainException {
  constructor(minOrderAmount?: number, currentAmount?: number) {
    super(
      'CP011',
      minOrderAmount !== undefined && currentAmount !== undefined
        ? `Minimum order amount not met. Required: ${minOrderAmount}, Current: ${currentAmount}`
        : 'Minimum order amount not met',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * CP012: 유효하지 않은 쿠폰 코드
 */
export class InvalidCouponCodeException extends CouponDomainException {
  constructor(couponCode?: string) {
    super(
      'CP012',
      couponCode ? `Invalid coupon code: ${couponCode}` : 'Invalid coupon code',
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * CP013: 사용되지 않은 쿠폰 (복원 불가)
 */
export class CouponNotUsedException extends CouponDomainException {
  constructor(userCouponId?: number) {
    super(
      'CP013',
      userCouponId
        ? `User coupon with ID ${userCouponId} has not been used and cannot be restored`
        : 'Coupon has not been used and cannot be restored',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * CP014: 쿠폰 서비스 일시 불가
 */
export class CouponServiceUnavailableException extends CouponDomainException {
  constructor() {
    super(
      'CP014',
      'Coupon service is temporarily unavailable. Please try again later.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
