import { User } from './user.entity';
import {
  InvalidNameLengthException,
  InvalidDisplayNameLengthException,
  InvalidPhoneNumberFormatException,
} from '../exceptions';

describe('User Entity', () => {
  const validUserProps = {
    id: 1,
    loginId: 'testuser',
    loginPassword: 'hashed_password',
    email: 'test@example.com',
    name: '홍길동',
    displayName: '길동이',
    phoneNumber: '010-1234-5678',
    point: 10000,
    lastLoginAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: null,
  };

  describe('create', () => {
    describe('성공 케이스', () => {
      it('유효한 데이터로 User 엔티티를 생성할 수 있다', () => {
        // Given: 유효한 사용자 정보
        const props = { ...validUserProps };

        // When: User.create() 호출
        const user = User.create(props);

        // Then: User 엔티티 생성 성공
        expect(user).toBeInstanceOf(User);
        expect(user.id).toBe(props.id);
        expect(user.email).toBe(props.email);
        expect(user.name).toBe(props.name);
        expect(user.displayName).toBe(props.displayName);
        expect(user.phoneNumber).toBe(props.phoneNumber);
      });

      it('displayName과 phoneNumber가 없어도 생성할 수 있다', () => {
        // Given: displayName, phoneNumber가 null인 정보
        const props = {
          ...validUserProps,
          displayName: null,
          phoneNumber: null,
        };

        // When: User.create() 호출
        const user = User.create(props);

        // Then: User 엔티티 생성 성공, null 값 허용
        expect(user.displayName).toBeNull();
        expect(user.phoneNumber).toBeNull();
      });

      it('point가 없으면 기본값 0으로 생성된다', () => {
        // Given: point가 없는 정보
        const props = { ...validUserProps };
        delete (props as any).point;

        // When: User.create() 호출
        const user = User.create(props);

        // Then: point = 0
        expect(user.getPoint()).toBe(0);
      });
    });

    describe('이메일 검증 실패', () => {
      it('잘못된 이메일 형식이면 에러를 발생시킨다', () => {
        // Given: 잘못된 이메일 형식
        const props = { ...validUserProps, email: 'invalid-email' };

        // When & Then: User.create() 호출 시 에러 발생
        expect(() => User.create(props)).toThrow('Invalid email format');
      });

      it('@ 기호가 없는 이메일이면 에러를 발생시킨다', () => {
        // Given: @ 기호 없는 이메일
        const props = { ...validUserProps, email: 'testexample.com' };

        // When & Then: 에러 발생
        expect(() => User.create(props)).toThrow('Invalid email format');
      });
    });

    describe('이름 검증 실패', () => {
      it('이름이 2자 미만이면 InvalidNameLengthException을 발생시킨다', () => {
        // Given: 1자 이름
        const props = { ...validUserProps, name: '홍' };

        // When & Then: 예외 발생
        expect(() => User.create(props)).toThrow(InvalidNameLengthException);
      });

      it('이름이 50자 초과면 InvalidNameLengthException을 발생시킨다', () => {
        // Given: 51자 이름
        const props = { ...validUserProps, name: 'a'.repeat(51) };

        // When & Then: 예외 발생
        expect(() => User.create(props)).toThrow(InvalidNameLengthException);
      });

      it('이름이 공백만 있으면 InvalidNameLengthException을 발생시킨다', () => {
        // Given: 공백 이름
        const props = { ...validUserProps, name: '   ' };

        // When & Then: 예외 발생
        expect(() => User.create(props)).toThrow(InvalidNameLengthException);
      });
    });

    describe('닉네임 검증 실패', () => {
      it('닉네임이 2자 미만이면 InvalidDisplayNameLengthException을 발생시킨다', () => {
        // Given: 1자 닉네임
        const props = { ...validUserProps, displayName: '홍' };

        // When & Then: 예외 발생
        expect(() => User.create(props)).toThrow(InvalidDisplayNameLengthException);
      });

      it('닉네임이 20자 초과면 InvalidDisplayNameLengthException을 발생시킨다', () => {
        // Given: 21자 닉네임
        const props = { ...validUserProps, displayName: 'a'.repeat(21) };

        // When & Then: 예외 발생
        expect(() => User.create(props)).toThrow(InvalidDisplayNameLengthException);
      });
    });

    describe('전화번호 검증 실패', () => {
      it('잘못된 전화번호 형식이면 InvalidPhoneNumberFormatException을 발생시킨다', () => {
        // Given: 잘못된 형식
        const props = { ...validUserProps, phoneNumber: '123-456' };

        // When & Then: 예외 발생
        expect(() => User.create(props)).toThrow(InvalidPhoneNumberFormatException);
      });

      it('문자가 포함된 전화번호면 InvalidPhoneNumberFormatException을 발생시킨다', () => {
        // Given: 문자 포함
        const props = { ...validUserProps, phoneNumber: '010-abcd-5678' };

        // When & Then: 예외 발생
        expect(() => User.create(props)).toThrow(InvalidPhoneNumberFormatException);
      });
    });

    describe('포인트 검증 실패', () => {
      it('포인트가 음수면 에러를 발생시킨다', () => {
        // Given: 음수 포인트
        const props = { ...validUserProps, point: -100 };

        // When & Then: 에러 발생
        expect(() => User.create(props)).toThrow('Point cannot be negative');
      });

      it('포인트가 10,000,000을 초과하면 에러를 발생시킨다', () => {
        // Given: 초과 포인트
        const props = { ...validUserProps, point: 10_000_001 };

        // When & Then: 에러 발생
        expect(() => User.create(props)).toThrow('Point cannot exceed 10,000,000');
      });
    });
  });

  describe('updateProfile', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(validUserProps);
    });

    describe('성공 케이스', () => {
      it('이름만 수정할 수 있다', () => {
        // Given: 기존 User
        const newName = '김철수';

        // When: 이름만 수정
        user.updateProfile({ name: newName });

        // Then: 이름 변경, updatedAt 갱신
        expect(user.name).toBe(newName);
        expect(user.displayName).toBe(validUserProps.displayName);
        expect(user.updatedAt).not.toBeNull();
      });

      it('닉네임만 수정할 수 있다', () => {
        // Given: 기존 User
        const newDisplayName = '새닉네임';

        // When: 닉네임만 수정
        user.updateProfile({ displayName: newDisplayName });

        // Then: 닉네임 변경
        expect(user.displayName).toBe(newDisplayName);
        expect(user.name).toBe(validUserProps.name);
      });

      it('전화번호만 수정할 수 있다', () => {
        // Given: 기존 User
        const newPhoneNumber = '010-9876-5432';

        // When: 전화번호만 수정
        user.updateProfile({ phoneNumber: newPhoneNumber });

        // Then: 전화번호 변경
        expect(user.phoneNumber).toBe(newPhoneNumber);
      });

      it('여러 필드를 동시에 수정할 수 있다', () => {
        // Given: 기존 User
        const updates = {
          name: '이영희',
          displayName: '영희',
          phoneNumber: '010-1111-2222',
        };

        // When: 여러 필드 수정
        user.updateProfile(updates);

        // Then: 모든 필드 변경
        expect(user.name).toBe(updates.name);
        expect(user.displayName).toBe(updates.displayName);
        expect(user.phoneNumber).toBe(updates.phoneNumber);
      });

      it('전화번호를 하이픈 없이 수정할 수 있다', () => {
        // Given: 기존 User
        const newPhoneNumber = '01012345678';

        // When: 하이픈 없는 전화번호로 수정
        user.updateProfile({ phoneNumber: newPhoneNumber });

        // Then: 전화번호 변경
        expect(user.phoneNumber).toBe(newPhoneNumber);
      });
    });

    describe('검증 실패', () => {
      it('유효하지 않은 이름으로 수정하면 InvalidNameLengthException을 발생시킨다', () => {
        // Given: 기존 User, 잘못된 이름
        const invalidName = '홍';

        // When & Then: 예외 발생
        expect(() => user.updateProfile({ name: invalidName })).toThrow(
          InvalidNameLengthException,
        );
      });

      it('유효하지 않은 닉네임으로 수정하면 InvalidDisplayNameLengthException을 발생시킨다', () => {
        // Given: 기존 User, 잘못된 닉네임
        const invalidDisplayName = 'a'.repeat(21);

        // When & Then: 예외 발생
        expect(() => user.updateProfile({ displayName: invalidDisplayName })).toThrow(
          InvalidDisplayNameLengthException,
        );
      });

      it('유효하지 않은 전화번호로 수정하면 InvalidPhoneNumberFormatException을 발생시킨다', () => {
        // Given: 기존 User, 잘못된 전화번호
        const invalidPhoneNumber = '123-456';

        // When & Then: 예외 발생
        expect(() => user.updateProfile({ phoneNumber: invalidPhoneNumber })).toThrow(
          InvalidPhoneNumberFormatException,
        );
      });
    });

    describe('updatedAt 갱신', () => {
      it('프로필 수정 시 updatedAt이 현재 시각으로 갱신된다', () => {
        // Given: 기존 User
        const beforeUpdate = new Date().toISOString();

        // When: 프로필 수정
        user.updateProfile({ name: '새이름' });

        // Then: updatedAt 갱신
        const afterUpdate = new Date().toISOString();
        expect(user.updatedAt).not.toBeNull();
        expect(user.updatedAt! >= beforeUpdate).toBe(true);
        expect(user.updatedAt! <= afterUpdate).toBe(true);
      });
    });
  });

  describe('chargePoint', () => {
    let user: User;

    beforeEach(() => {
      user = User.create({ ...validUserProps, point: 10000 });
    });

    it('유효한 금액을 충전할 수 있다', () => {
      // Given: 기존 포인트 10,000
      const chargeAmount = 5000;
      const initialPoint = user.getPoint();

      // When: 5,000원 충전
      user.chargePoint(chargeAmount);

      // Then: 15,000원
      expect(user.getPoint()).toBe(initialPoint + chargeAmount);
    });
  });

  describe('deductPoint', () => {
    let user: User;

    beforeEach(() => {
      user = User.create({ ...validUserProps, point: 10000 });
    });

    it('유효한 금액을 차감할 수 있다', () => {
      // Given: 기존 포인트 10,000
      const deductAmount = 3000;
      const initialPoint = user.getPoint();

      // When: 3,000원 차감
      user.deductPoint(deductAmount);

      // Then: 7,000원
      expect(user.getPoint()).toBe(initialPoint - deductAmount);
    });
  });

  describe('getPoint', () => {
    it('현재 포인트를 조회할 수 있다', () => {
      // Given: 포인트 10,000인 User
      const user = User.create({ ...validUserProps, point: 10000 });

      // When: getPoint() 호출
      const point = user.getPoint();

      // Then: 10,000 반환
      expect(point).toBe(10000);
    });
  });
});
