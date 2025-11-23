import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * User 도메인 예외 기본 클래스
 */
export class UserDomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}

/**
 * U001: 사용자를 찾을 수 없음
 */
export class UserNotFoundException extends UserDomainException {
  constructor(userId?: number) {
    super(
      'U001',
      userId ? `User with ID ${userId} not found` : 'User not found',
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * U002: 프로필을 찾을 수 없음
 */
export class ProfileNotFoundException extends UserDomainException {
  constructor(userId?: number) {
    super(
      'U002',
      userId ? `Profile for user ${userId} not found` : 'Profile not found',
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * U003: 닉네임 길이가 유효하지 않음 (2~20자)
 */
export class InvalidDisplayNameLengthException extends UserDomainException {
  constructor() {
    super(
      'U003',
      'Display name must be between 2 and 20 characters',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * U004: 이름 길이가 유효하지 않음 (2~50자)
 */
export class InvalidNameLengthException extends UserDomainException {
  constructor() {
    super(
      'U004',
      'Name must be between 2 and 50 characters',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * U005: 전화번호 형식이 유효하지 않음
 */
export class InvalidPhoneNumberFormatException extends UserDomainException {
  constructor() {
    super('U005', 'Invalid phone number format', HttpStatus.BAD_REQUEST);
  }
}

/**
 * U006: 배송지를 찾을 수 없음
 */
export class AddressNotFoundException extends UserDomainException {
  constructor(addressId?: number) {
    super(
      'U006',
      addressId
        ? `Address with ID ${addressId} not found`
        : 'Address not found',
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * U007: 해당 배송지에 접근 권한이 없음
 */
export class AddressAccessDeniedException extends UserDomainException {
  constructor(addressId?: number) {
    super(
      'U007',
      addressId
        ? `Access denied to address ${addressId}`
        : 'Access denied to address',
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * U008: 최대 배송지 개수(10개) 초과
 */
export class MaxAddressLimitExceededException extends UserDomainException {
  constructor() {
    super(
      'U008',
      'Maximum address limit (10) exceeded',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * U009: 수령인 이름이 유효하지 않음
 */
export class InvalidRecipientNameException extends UserDomainException {
  constructor() {
    super(
      'U009',
      'Recipient name must be between 2 and 50 characters',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * U010: 우편번호 형식이 유효하지 않음 (5자리 숫자)
 */
export class InvalidZipCodeFormatException extends UserDomainException {
  constructor() {
    super('U010', 'Zip code must be 5 digits', HttpStatus.BAD_REQUEST);
  }
}

/**
 * U011: 주소가 유효하지 않음
 */
export class InvalidAddressException extends UserDomainException {
  constructor(message?: string) {
    super('U011', message || 'Invalid address', HttpStatus.BAD_REQUEST);
  }
}

/**
 * U012: 잔액 부족
 */
export class InsufficientBalanceException extends UserDomainException {
  constructor(userId: number, required: number, available: number) {
    super(
      'U012',
      `Insufficient balance for user ${userId}. Required: ${required}, Available: ${available}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
