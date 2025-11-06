import { HttpStatus } from '@nestjs/common';
import {
  UserDomainException,
  UserNotFoundException,
  ProfileNotFoundException,
  InvalidDisplayNameLengthException,
  InvalidNameLengthException,
  InvalidPhoneNumberFormatException,
  AddressNotFoundException,
  AddressAccessDeniedException,
  MaxAddressLimitExceededException,
  InvalidRecipientNameException,
  InvalidZipCodeFormatException,
  InvalidAddressException,
} from './user.exception';

describe('User Domain Exceptions', () => {
  describe('UserDomainException', () => {
    it('기본 예외 클래스를 생성할 수 있다', () => {
      // Given: 코드와 메시지
      const code = 'TEST001';
      const message = 'Test exception';

      // When: UserDomainException 생성
      const exception = new UserDomainException(code, message);

      // Then: 코드, 메시지, 상태 확인
      expect(exception).toBeInstanceOf(UserDomainException);
      expect(exception.code).toBe(code);
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('커스텀 HTTP 상태를 설정할 수 있다', () => {
      // Given: 코드, 메시지, 커스텀 상태
      const code = 'TEST001';
      const message = 'Test exception';
      const status = HttpStatus.NOT_FOUND;

      // When: UserDomainException 생성
      const exception = new UserDomainException(code, message, status);

      // Then: 커스텀 상태 확인
      expect(exception.getStatus()).toBe(status);
    });
  });

  describe('U001 - UserNotFoundException', () => {
    it('userId 없이 예외를 생성할 수 있다', () => {
      // Given: userId 없음
      // When: UserNotFoundException 생성
      const exception = new UserNotFoundException();

      // Then: 코드 U001, 상태 404
      expect(exception.code).toBe('U001');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.message).toContain('User not found');
    });

    it('userId와 함께 예외를 생성할 수 있다', () => {
      // Given: userId = 123
      const userId = 123;

      // When: UserNotFoundException 생성
      const exception = new UserNotFoundException(userId);

      // Then: 메시지에 userId 포함
      expect(exception.code).toBe('U001');
      expect(exception.message).toContain('123');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('U002 - ProfileNotFoundException', () => {
    it('프로필을 찾을 수 없음 예외를 생성할 수 있다', () => {
      // Given: userId 없음
      // When: ProfileNotFoundException 생성
      const exception = new ProfileNotFoundException();

      // Then: 코드 U002, 상태 404
      expect(exception.code).toBe('U002');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.message).toContain('Profile not found');
    });

    it('userId와 함께 예외를 생성할 수 있다', () => {
      // Given: userId = 456
      const userId = 456;

      // When: ProfileNotFoundException 생성
      const exception = new ProfileNotFoundException(userId);

      // Then: 메시지에 userId 포함
      expect(exception.code).toBe('U002');
      expect(exception.message).toContain('456');
    });
  });

  describe('U003 - InvalidDisplayNameLengthException', () => {
    it('닉네임 길이 유효하지 않음 예외를 생성할 수 있다', () => {
      // Given: 조건 없음
      // When: InvalidDisplayNameLengthException 생성
      const exception = new InvalidDisplayNameLengthException();

      // Then: 코드 U003, 상태 400
      expect(exception.code).toBe('U003');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.message).toContain('Display name');
      expect(exception.message).toContain('2 and 20');
    });
  });

  describe('U004 - InvalidNameLengthException', () => {
    it('이름 길이 유효하지 않음 예외를 생성할 수 있다', () => {
      // Given: 조건 없음
      // When: InvalidNameLengthException 생성
      const exception = new InvalidNameLengthException();

      // Then: 코드 U004, 상태 400
      expect(exception.code).toBe('U004');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.message).toContain('Name');
      expect(exception.message).toContain('2 and 50');
    });
  });

  describe('U005 - InvalidPhoneNumberFormatException', () => {
    it('전화번호 형식 유효하지 않음 예외를 생성할 수 있다', () => {
      // Given: 조건 없음
      // When: InvalidPhoneNumberFormatException 생성
      const exception = new InvalidPhoneNumberFormatException();

      // Then: 코드 U005, 상태 400
      expect(exception.code).toBe('U005');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.message).toContain('phone number');
    });
  });

  describe('U006 - AddressNotFoundException', () => {
    it('배송지를 찾을 수 없음 예외를 생성할 수 있다', () => {
      // Given: addressId 없음
      // When: AddressNotFoundException 생성
      const exception = new AddressNotFoundException();

      // Then: 코드 U006, 상태 404
      expect(exception.code).toBe('U006');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.message).toContain('Address');
      expect(exception.message).toContain('not found');
    });

    it('addressId와 함께 예외를 생성할 수 있다', () => {
      // Given: addressId = 789
      const addressId = 789;

      // When: AddressNotFoundException 생성
      const exception = new AddressNotFoundException(addressId);

      // Then: 메시지에 addressId 포함
      expect(exception.code).toBe('U006');
      expect(exception.message).toContain('789');
    });
  });

  describe('U007 - AddressAccessDeniedException', () => {
    it('배송지 접근 권한 없음 예외를 생성할 수 있다', () => {
      // Given: addressId 없음
      // When: AddressAccessDeniedException 생성
      const exception = new AddressAccessDeniedException();

      // Then: 코드 U007, 상태 403
      expect(exception.code).toBe('U007');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(exception.message).toContain('Access denied');
    });

    it('addressId와 함께 예외를 생성할 수 있다', () => {
      // Given: addressId = 999
      const addressId = 999;

      // When: AddressAccessDeniedException 생성
      const exception = new AddressAccessDeniedException(addressId);

      // Then: 메시지에 addressId 포함
      expect(exception.code).toBe('U007');
      expect(exception.message).toContain('999');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('U008 - MaxAddressLimitExceededException', () => {
    it('최대 배송지 개수 초과 예외를 생성할 수 있다', () => {
      // Given: 조건 없음
      // When: MaxAddressLimitExceededException 생성
      const exception = new MaxAddressLimitExceededException();

      // Then: 코드 U008, 상태 400
      expect(exception.code).toBe('U008');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.message).toContain('Maximum address limit');
      expect(exception.message).toContain('10');
    });
  });

  describe('U009 - InvalidRecipientNameException', () => {
    it('수령인 이름 유효하지 않음 예외를 생성할 수 있다', () => {
      // Given: 조건 없음
      // When: InvalidRecipientNameException 생성
      const exception = new InvalidRecipientNameException();

      // Then: 코드 U009, 상태 400
      expect(exception.code).toBe('U009');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.message).toContain('Recipient name');
      expect(exception.message).toContain('2 and 50');
    });
  });

  describe('U010 - InvalidZipCodeFormatException', () => {
    it('우편번호 형식 유효하지 않음 예외를 생성할 수 있다', () => {
      // Given: 조건 없음
      // When: InvalidZipCodeFormatException 생성
      const exception = new InvalidZipCodeFormatException();

      // Then: 코드 U010, 상태 400
      expect(exception.code).toBe('U010');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.message).toContain('Zip code');
      expect(exception.message).toContain('5 digits');
    });
  });

  describe('U011 - InvalidAddressException', () => {
    it('주소 유효하지 않음 예외를 기본 메시지로 생성할 수 있다', () => {
      // Given: 커스텀 메시지 없음
      // When: InvalidAddressException 생성
      const exception = new InvalidAddressException();

      // Then: 코드 U011, 상태 400, 기본 메시지
      expect(exception.code).toBe('U011');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.message).toContain('Invalid address');
    });

    it('커스텀 메시지로 예외를 생성할 수 있다', () => {
      // Given: 커스텀 메시지
      const customMessage = 'Address is too long';

      // When: InvalidAddressException 생성
      const exception = new InvalidAddressException(customMessage);

      // Then: 커스텀 메시지 확인
      expect(exception.code).toBe('U011');
      expect(exception.message).toBe(customMessage);
    });
  });

  describe('예외 상속 구조', () => {
    it('모든 User 예외는 UserDomainException을 상속한다', () => {
      // Given: 각 예외 인스턴스
      const exceptions = [
        new UserNotFoundException(),
        new ProfileNotFoundException(),
        new InvalidDisplayNameLengthException(),
        new InvalidNameLengthException(),
        new InvalidPhoneNumberFormatException(),
        new AddressNotFoundException(),
        new AddressAccessDeniedException(),
        new MaxAddressLimitExceededException(),
        new InvalidRecipientNameException(),
        new InvalidZipCodeFormatException(),
        new InvalidAddressException(),
      ];

      // When & Then: 모든 예외가 UserDomainException 인스턴스
      exceptions.forEach((exception) => {
        expect(exception).toBeInstanceOf(UserDomainException);
      });
    });

    it('모든 User 예외는 고유한 에러 코드를 가진다', () => {
      // Given: 모든 예외 생성
      const exceptions = [
        new UserNotFoundException(),
        new ProfileNotFoundException(),
        new InvalidDisplayNameLengthException(),
        new InvalidNameLengthException(),
        new InvalidPhoneNumberFormatException(),
        new AddressNotFoundException(),
        new AddressAccessDeniedException(),
        new MaxAddressLimitExceededException(),
        new InvalidRecipientNameException(),
        new InvalidZipCodeFormatException(),
        new InvalidAddressException(),
      ];

      // When: 에러 코드 수집
      const codes = exceptions.map((ex) => ex.code);

      // Then: 모든 코드가 고유함
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(exceptions.length);
      expect(codes).toEqual(['U001', 'U002', 'U003', 'U004', 'U005', 'U006', 'U007', 'U008', 'U009', 'U010', 'U011']);
    });
  });
});
