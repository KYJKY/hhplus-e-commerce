import { UserAddress } from './user-address.entity';
import {
  InvalidRecipientNameException,
  InvalidPhoneNumberFormatException,
  InvalidZipCodeFormatException,
  InvalidAddressException,
} from '../exceptions';

describe('UserAddress Entity', () => {
  const validAddressProps = {
    id: 1,
    userId: 1,
    recipientName: '홍길동',
    recipientPhone: '010-1234-5678',
    postalCode: '12345',
    addressDefaultText: '서울시 강남구 테헤란로 123',
    addressDetailText: '456호',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: null,
  };

  describe('create', () => {
    describe('성공 케이스', () => {
      it('유효한 데이터로 UserAddress 엔티티를 생성할 수 있다', () => {
        // Given: 유효한 배송지 정보
        const props = { ...validAddressProps };

        // When: UserAddress.create() 호출
        const address = UserAddress.create(props);

        // Then: UserAddress 엔티티 생성 성공
        expect(address).toBeInstanceOf(UserAddress);
        expect(address.id).toBe(props.id);
        expect(address.userId).toBe(props.userId);
        expect(address.recipientName).toBe(props.recipientName);
        expect(address.recipientPhone).toBe(props.recipientPhone);
        expect(address.postalCode).toBe(props.postalCode);
        expect(address.addressDefaultText).toBe(props.addressDefaultText);
        expect(address.addressDetailText).toBe(props.addressDetailText);
        expect(address.isDefault).toBe(props.isDefault);
      });

      it('addressDetailText가 null이어도 생성할 수 있다', () => {
        // Given: addressDetailText가 null인 정보
        const props = { ...validAddressProps, addressDetailText: null };

        // When: UserAddress.create() 호출
        const address = UserAddress.create(props);

        // Then: addressDetailText = null
        expect(address.addressDetailText).toBeNull();
      });

      it('하이픈 없는 전화번호로도 생성할 수 있다', () => {
        // Given: 하이픈 없는 전화번호
        const props = { ...validAddressProps, recipientPhone: '01012345678' };

        // When: UserAddress.create() 호출
        const address = UserAddress.create(props);

        // Then: 생성 성공
        expect(address.recipientPhone).toBe('01012345678');
      });
    });

    describe('수령인 이름 검증 실패', () => {
      it('수령인 이름이 2자 미만이면 InvalidRecipientNameException을 발생시킨다', () => {
        // Given: 1자 이름
        const props = { ...validAddressProps, recipientName: '홍' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidRecipientNameException);
      });

      it('수령인 이름이 50자 초과면 InvalidRecipientNameException을 발생시킨다', () => {
        // Given: 51자 이름
        const props = { ...validAddressProps, recipientName: 'a'.repeat(51) };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidRecipientNameException);
      });

      it('수령인 이름이 공백만 있으면 InvalidRecipientNameException을 발생시킨다', () => {
        // Given: 공백 이름
        const props = { ...validAddressProps, recipientName: '   ' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidRecipientNameException);
      });
    });

    describe('전화번호 검증 실패', () => {
      it('잘못된 전화번호 형식이면 InvalidPhoneNumberFormatException을 발생시킨다', () => {
        // Given: 잘못된 형식
        const props = { ...validAddressProps, recipientPhone: '123-456' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidPhoneNumberFormatException);
      });

      it('문자가 포함된 전화번호면 InvalidPhoneNumberFormatException을 발생시킨다', () => {
        // Given: 문자 포함
        const props = { ...validAddressProps, recipientPhone: '010-abcd-5678' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidPhoneNumberFormatException);
      });

      it('너무 짧은 전화번호면 InvalidPhoneNumberFormatException을 발생시킨다', () => {
        // Given: 짧은 전화번호
        const props = { ...validAddressProps, recipientPhone: '010-123' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidPhoneNumberFormatException);
      });
    });

    describe('우편번호 검증 실패', () => {
      it('5자리가 아닌 우편번호면 InvalidZipCodeFormatException을 발생시킨다', () => {
        // Given: 4자리 우편번호
        const props = { ...validAddressProps, postalCode: '1234' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidZipCodeFormatException);
      });

      it('숫자가 아닌 우편번호면 InvalidZipCodeFormatException을 발생시킨다', () => {
        // Given: 문자 포함 우편번호
        const props = { ...validAddressProps, postalCode: '1234a' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidZipCodeFormatException);
      });

      it('하이픈이 포함된 우편번호면 InvalidZipCodeFormatException을 발생시킨다', () => {
        // Given: 하이픈 포함 우편번호
        const props = { ...validAddressProps, postalCode: '123-45' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidZipCodeFormatException);
      });
    });

    describe('주소 검증 실패', () => {
      it('빈 주소면 InvalidAddressException을 발생시킨다', () => {
        // Given: 빈 주소
        const props = { ...validAddressProps, addressDefaultText:'' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidAddressException);
        expect(() => UserAddress.create(props)).toThrow('Address is required');
      });

      it('공백만 있는 주소면 InvalidAddressException을 발생시킨다', () => {
        // Given: 공백 주소
        const props = { ...validAddressProps, addressDefaultText:'   ' };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidAddressException);
      });

      it('200자를 초과하는 주소면 InvalidAddressException을 발생시킨다', () => {
        // Given: 201자 주소
        const props = { ...validAddressProps, addressDefaultText:'a'.repeat(201) };

        // When & Then: 예외 발생
        expect(() => UserAddress.create(props)).toThrow(InvalidAddressException);
        expect(() => UserAddress.create(props)).toThrow('Address is too long');
      });
    });
  });

  describe('update', () => {
    let addressDefaultText:UserAddress;

    beforeEach(() => {
      address = UserAddress.create(validAddressProps);
    });

    describe('성공 케이스', () => {
      it('수령인 이름만 수정할 수 있다', () => {
        // Given: 기존 UserAddress
        const newRecipientName = '김철수';

        // When: 수령인 이름만 수정
        address.update({ recipientName: newRecipientName });

        // Then: 수령인 이름 변경, updatedAt 갱신
        expect(address.recipientName).toBe(newRecipientName);
        expect(address.recipientPhone).toBe(validAddressProps.recipientPhone);
        expect(address.updatedAt).not.toBeNull();
      });

      it('전화번호만 수정할 수 있다', () => {
        // Given: 기존 UserAddress
        const newPhoneNumber = '010-9876-5432';

        // When: 전화번호만 수정
        address.update({ recipientPhone: newPhoneNumber });

        // Then: 전화번호 변경
        expect(address.recipientPhone).toBe(newPhoneNumber);
      });

      it('우편번호와 주소를 함께 수정할 수 있다', () => {
        // Given: 기존 UserAddress
        const updates = {
          postalCode: '54321',
          addressDefaultText:'부산시 해운대구 센텀로 100',
        };

        // When: 여러 필드 수정
        address.update(updates);

        // Then: 모든 필드 변경
        expect(address.postalCode).toBe(updates.postalCode);
        expect(address.addressDefaultText).toBe(updates.addressDefaultText);
      });

      it('상세주소를 null로 변경할 수 있다', () => {
        // Given: addressDetailText가 있는 UserAddress
        const updates = { addressDetailText: null };

        // When: addressDetailText를 null로 수정
        address.update(updates);

        // Then: addressDetailText = null
        expect(address.addressDetailText).toBeNull();
      });

      it('부분 업데이트 시 나머지 필드는 유지된다', () => {
        // Given: 기존 UserAddress
        const originalZipCode = address.postalCode;
        const originalAddress = address.addressDefaultText;

        // When: 수령인 이름만 수정
        address.update({ recipientName: '새이름' });

        // Then: 나머지 필드 유지
        expect(address.postalCode).toBe(originalZipCode);
        expect(address.addressDefaultText).toBe(originalAddress);
      });
    });

    describe('검증 실패', () => {
      it('유효하지 않은 수령인 이름으로 수정하면 InvalidRecipientNameException을 발생시킨다', () => {
        // Given: 기존 UserAddress
        const invalidName = '홍';

        // When & Then: 예외 발생
        expect(() => address.update({ recipientName: invalidName })).toThrow(
          InvalidRecipientNameException,
        );
      });

      it('유효하지 않은 전화번호로 수정하면 InvalidPhoneNumberFormatException을 발생시킨다', () => {
        // Given: 기존 UserAddress
        const invalidPhoneNumber = '123-456';

        // When & Then: 예외 발생
        expect(() => address.update({ recipientPhone: invalidPhoneNumber })).toThrow(
          InvalidPhoneNumberFormatException,
        );
      });

      it('유효하지 않은 우편번호로 수정하면 InvalidZipCodeFormatException을 발생시킨다', () => {
        // Given: 기존 UserAddress
        const invalidZipCode = '1234';

        // When & Then: 예외 발생
        expect(() => address.update({ postalCode: invalidZipCode })).toThrow(
          InvalidZipCodeFormatException,
        );
      });

      it('유효하지 않은 주소로 수정하면 InvalidAddressException을 발생시킨다', () => {
        // Given: 기존 UserAddress
        const invalidAddress = '';

        // When & Then: 예외 발생
        expect(() => address.update({ addressDefaultText:invalidAddress })).toThrow(
          InvalidAddressException,
        );
      });
    });

    describe('updatedAt 갱신', () => {
      it('배송지 수정 시 updatedAt이 현재 시각으로 갱신된다', () => {
        // Given: 기존 UserAddress
        const beforeUpdate = new Date().toISOString();

        // When: 배송지 수정
        address.update({ recipientName: '새이름' });

        // Then: updatedAt 갱신
        const afterUpdate = new Date().toISOString();
        expect(address.updatedAt).not.toBeNull();
        expect(address.updatedAt! >= beforeUpdate).toBe(true);
        expect(address.updatedAt! <= afterUpdate).toBe(true);
      });
    });
  });

  describe('setAsDefault', () => {
    it('기본 배송지로 설정할 수 있다', () => {
      // Given: 기본 배송지가 아닌 UserAddress
      const address = UserAddress.create({ ...validAddressProps, isDefault: false });

      // When: setAsDefault() 호출
      address.setAsDefault();

      // Then: isDefault = true, updatedAt 갱신
      expect(address.isDefault).toBe(true);
      expect(address.updatedAt).not.toBeNull();
    });

    it('이미 기본 배송지인 경우에도 호출할 수 있다', () => {
      // Given: 이미 기본 배송지인 UserAddress
      const address = UserAddress.create({ ...validAddressProps, isDefault: true });

      // When: setAsDefault() 호출
      address.setAsDefault();

      // Then: isDefault = true 유지
      expect(address.isDefault).toBe(true);
    });
  });

  describe('unsetAsDefault', () => {
    it('기본 배송지를 해제할 수 있다', () => {
      // Given: 기본 배송지인 UserAddress
      const address = UserAddress.create({ ...validAddressProps, isDefault: true });

      // When: unsetAsDefault() 호출
      address.unsetAsDefault();

      // Then: isDefault = false, updatedAt 갱신
      expect(address.isDefault).toBe(false);
      expect(address.updatedAt).not.toBeNull();
    });

    it('이미 기본 배송지가 아닌 경우에도 호출할 수 있다', () => {
      // Given: 기본 배송지가 아닌 UserAddress
      const address = UserAddress.create({ ...validAddressProps, isDefault: false });

      // When: unsetAsDefault() 호출
      address.unsetAsDefault();

      // Then: isDefault = false 유지
      expect(address.isDefault).toBe(false);
    });
  });
});
