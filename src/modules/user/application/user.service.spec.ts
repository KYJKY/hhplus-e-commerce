import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { User } from '../domain/entities/user.entity';
import { UserAddress } from '../domain/entities/user-address.entity';
import {
  UserNotFoundException,
  AddressNotFoundException,
  AddressAccessDeniedException,
  MaxAddressLimitExceededException,
  InvalidNameLengthException,
  InvalidDisplayNameLengthException,
  InvalidPhoneNumberFormatException,
} from '../domain/exceptions';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: any;
  let mockUserAddressRepository: any;

  const mockUser = User.create({
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
  });

  const mockAddress = UserAddress.create({
    id: 1,
    userId: 1,
    recipientName: '홍길동',
    recipientPhone: '010-1234-5678',
    postalCode: '12345',
    addressDefaultText: '서울시 강남구 테헤란로 123',
    addressDetailText: '456호',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: null,
  });

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      clear: jest.fn(),
      findByLoginId: jest.fn(),
      findByEmail: jest.fn(),
      deductPointWithLock: jest.fn(),
    };

    mockUserAddressRepository = {
      findById: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      clear: jest.fn(),
      findByUserId: jest.fn(),
      findDefaultByUserId: jest.fn(),
      countByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      unsetDefaultByUserId: jest.fn(),
      setDefaultAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'IUserAddressRepository',
          useValue: mockUserAddressRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('FR-U-001: getUserById', () => {
    describe('성공 케이스', () => {
      it('존재하는 사용자 ID로 사용자 정보를 조회할 수 있다', async () => {
        // Given: repository에 사용자 1 존재
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When: getUserById(1) 호출
        const result = await service.getUserById(1);

        // Then: 사용자 정보 반환
        expect(result).toEqual(mockUser);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      });

      it('반환된 사용자 정보는 User 엔티티 인스턴스다', async () => {
        // Given: repository에 사용자 존재
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When: getUserById 호출
        const result = await service.getUserById(1);

        // Then: User 인스턴스 반환
        expect(result).toBeInstanceOf(User);
        expect(result.id).toBe(1);
        expect(result.name).toBe('홍길동');
        expect(result.email).toBe('test@example.com');
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(service.getUserById(999)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
      });

      it('UserNotFoundException은 올바른 에러 코드(U001)를 가진다', async () => {
        // Given: 사용자 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: 에러 코드 확인
        try {
          await service.getUserById(999);
          fail('Should throw UserNotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(UserNotFoundException);
          expect((error as UserNotFoundException).code).toBe('U001');
        }
      });
    });
  });

  describe('FR-U-002: getProfile', () => {
    describe('성공 케이스', () => {
      it('사용자 ID로 프로필을 조회할 수 있다', async () => {
        // Given: repository에 사용자 1 존재
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When: getProfile(1) 호출
        const result = await service.getProfile(1);

        // Then: 프로필 정보 반환
        expect(result).toEqual(mockUser);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      });

      it('반환된 프로필은 사용자의 모든 정보를 포함한다', async () => {
        // Given: repository에 사용자 존재
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When: getProfile 호출
        const result = await service.getProfile(1);

        // Then: 모든 정보 포함
        expect(result.id).toBe(1);
        expect(result.name).toBe('홍길동');
        expect(result.displayName).toBe('길동이');
        expect(result.phoneNumber).toBe('010-1234-5678');
        expect(result.email).toBe('test@example.com');
        expect(result.getPoint()).toBe(10000);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(service.getProfile(999)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
      });
    });
  });

  describe('FR-U-003: updateProfile', () => {
    describe('성공 케이스', () => {
      it('사용자 이름만 수정할 수 있다', async () => {
        // Given: 사용자 존재, 새 이름
        const updatedUser = User.create({ ...mockUser, name: '김철수' } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserRepository.update.mockResolvedValue(updatedUser);

        // When: 이름만 수정
        const result = await service.updateProfile(1, { name: '김철수' });

        // Then: 이름 변경됨
        expect(result.name).toBe('김철수');
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(mockUserRepository.update).toHaveBeenCalledWith(
          1,
          expect.any(User),
        );
      });

      it('사용자 닉네임만 수정할 수 있다', async () => {
        // Given: 사용자 존재, 새 닉네임
        const updatedUser = User.create({
          ...mockUser,
          displayName: '새닉네임',
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserRepository.update.mockResolvedValue(updatedUser);

        // When: 닉네임만 수정
        const result = await service.updateProfile(1, {
          displayName: '새닉네임',
        });

        // Then: 닉네임 변경됨
        expect(result.displayName).toBe('새닉네임');
      });

      it('사용자 전화번호만 수정할 수 있다', async () => {
        // Given: 사용자 존재, 새 전화번호
        const updatedUser = User.create({
          ...mockUser,
          phoneNumber: '010-9876-5432',
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserRepository.update.mockResolvedValue(updatedUser);

        // When: 전화번호만 수정
        const result = await service.updateProfile(1, {
          phoneNumber: '010-9876-5432',
        });

        // Then: 전화번호 변경됨
        expect(result.phoneNumber).toBe('010-9876-5432');
      });

      it('여러 필드를 동시에 수정할 수 있다', async () => {
        // Given: 사용자 존재, 여러 필드 변경
        const updatedUser = User.create({
          ...mockUser,
          name: '이영희',
          displayName: '영희',
          phoneNumber: '010-1111-2222',
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserRepository.update.mockResolvedValue(updatedUser);

        // When: 여러 필드 동시 수정
        const result = await service.updateProfile(1, {
          name: '이영희',
          displayName: '영희',
          phoneNumber: '010-1111-2222',
        });

        // Then: 모든 필드 변경됨
        expect(result.name).toBe('이영희');
        expect(result.displayName).toBe('영희');
        expect(result.phoneNumber).toBe('010-1111-2222');
      });

      it('빈 객체로 수정하면 변경사항이 없다', async () => {
        // Given: 사용자 존재, 빈 업데이트
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserRepository.update.mockResolvedValue(mockUser);

        // When: 빈 객체로 수정
        const result = await service.updateProfile(1, {});

        // Then: 원본 유지
        expect(result).toEqual(mockUser);
        expect(mockUserRepository.update).toHaveBeenCalled();
      });

      it('전화번호를 하이픈 없이 수정할 수 있다', async () => {
        // Given: 사용자 존재
        const updatedUser = User.create({
          ...mockUser,
          phoneNumber: '01012345678',
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserRepository.update.mockResolvedValue(updatedUser);

        // When: 하이픈 없는 전화번호로 수정
        const result = await service.updateProfile(1, {
          phoneNumber: '01012345678',
        });

        // Then: 전화번호 변경됨
        expect(result.phoneNumber).toBe('01012345678');
      });
    });

    describe('실패 케이스 - 사용자 없음', () => {
      it('존재하지 않는 사용자의 프로필을 수정하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(
          service.updateProfile(999, { name: '이름' }),
        ).rejects.toThrow(UserNotFoundException);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
        expect(mockUserRepository.update).not.toHaveBeenCalled();
      });

      it('업데이트 후 사용자가 없으면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재하나 업데이트 실패
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserRepository.update.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(
          service.updateProfile(1, { name: '새이름' }),
        ).rejects.toThrow(UserNotFoundException);
      });
    });

    describe('실패 케이스 - 이름 검증', () => {
      it('이름이 2자 미만이면 InvalidNameLengthException을 발생시킨다', async () => {
        // Given: 사용자 존재, 1자 이름
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When & Then: InvalidNameLengthException 발생
        await expect(service.updateProfile(1, { name: '홍' })).rejects.toThrow(
          InvalidNameLengthException,
        );
        expect(mockUserRepository.update).not.toHaveBeenCalled();
      });

      it('이름이 50자 초과면 InvalidNameLengthException을 발생시킨다', async () => {
        // Given: 사용자 존재, 51자 이름
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When & Then: InvalidNameLengthException 발생
        await expect(
          service.updateProfile(1, { name: 'a'.repeat(51) }),
        ).rejects.toThrow(InvalidNameLengthException);
      });

      it('이름이 공백만 있으면 InvalidNameLengthException을 발생시킨다', async () => {
        // Given: 사용자 존재, 공백 이름
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When & Then: InvalidNameLengthException 발생
        await expect(service.updateProfile(1, { name: '   ' })).rejects.toThrow(
          InvalidNameLengthException,
        );
      });
    });

    describe('실패 케이스 - 닉네임 검증', () => {
      it('닉네임이 2자 미만이면 InvalidDisplayNameLengthException을 발생시킨다', async () => {
        // Given: 사용자 존재, 1자 닉네임
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When & Then: InvalidDisplayNameLengthException 발생
        await expect(
          service.updateProfile(1, { displayName: '홍' }),
        ).rejects.toThrow(InvalidDisplayNameLengthException);
        expect(mockUserRepository.update).not.toHaveBeenCalled();
      });

      it('닉네임이 20자 초과면 InvalidDisplayNameLengthException을 발생시킨다', async () => {
        // Given: 사용자 존재, 21자 닉네임
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When & Then: InvalidDisplayNameLengthException 발생
        await expect(
          service.updateProfile(1, { displayName: 'a'.repeat(21) }),
        ).rejects.toThrow(InvalidDisplayNameLengthException);
      });
    });

    describe('실패 케이스 - 전화번호 검증', () => {
      it('잘못된 전화번호 형식이면 InvalidPhoneNumberFormatException을 발생시킨다', async () => {
        // Given: 사용자 존재, 잘못된 전화번호
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When & Then: InvalidPhoneNumberFormatException 발생
        await expect(
          service.updateProfile(1, { phoneNumber: '123-456' }),
        ).rejects.toThrow(InvalidPhoneNumberFormatException);
        expect(mockUserRepository.update).not.toHaveBeenCalled();
      });

      it('문자가 포함된 전화번호면 InvalidPhoneNumberFormatException을 발생시킨다', async () => {
        // Given: 사용자 존재, 문자 포함 전화번호
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When & Then: InvalidPhoneNumberFormatException 발생
        await expect(
          service.updateProfile(1, { phoneNumber: '010-abcd-5678' }),
        ).rejects.toThrow(InvalidPhoneNumberFormatException);
      });

      it('너무 짧은 전화번호면 InvalidPhoneNumberFormatException을 발생시킨다', async () => {
        // Given: 사용자 존재, 짧은 전화번호
        mockUserRepository.findById.mockResolvedValue(mockUser);

        // When & Then: InvalidPhoneNumberFormatException 발생
        await expect(
          service.updateProfile(1, { phoneNumber: '010-123' }),
        ).rejects.toThrow(InvalidPhoneNumberFormatException);
      });
    });

    describe('도메인 로직 호출 검증', () => {
      it('updateProfile 호출 시 User 엔티티의 updateProfile 메서드가 호출된다', async () => {
        // Given: 사용자 존재
        const userSpy = jest.spyOn(mockUser, 'updateProfile');
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserRepository.update.mockResolvedValue(mockUser);

        // When: updateProfile 호출
        await service.updateProfile(1, { name: '새이름' });

        // Then: User 엔티티의 updateProfile 메서드 호출됨
        expect(userSpy).toHaveBeenCalledWith({ name: '새이름' });
      });

      it('updateProfile 호출 시 repository의 update 메서드가 호출된다', async () => {
        // Given: 사용자 존재
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserRepository.update.mockResolvedValue(mockUser);

        // When: updateProfile 호출
        await service.updateProfile(1, { name: '새이름' });

        // Then: repository.update 호출됨
        expect(mockUserRepository.update).toHaveBeenCalledWith(1, mockUser);
      });
    });
  });

  describe('FR-U-004: getAddressList', () => {
    describe('성공 케이스', () => {
      it('사용자의 모든 배송지를 조회할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 3개
        const addresses = [mockAddress, mockAddress, mockAddress];
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByUserId.mockResolvedValue(addresses);

        // When: getAddressList(1) 호출
        const result = await service.getAddressList(1);

        // Then: 배송지 목록 반환
        expect(result).toEqual(addresses);
        expect(result).toHaveLength(3);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(mockUserAddressRepository.findByUserId).toHaveBeenCalledWith(1);
      });

      it('배송지가 없는 경우 빈 배열을 반환한다', async () => {
        // Given: 사용자 존재, 배송지 없음
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByUserId.mockResolvedValue([]);

        // When: getAddressList 호출
        const result = await service.getAddressList(1);

        // Then: 빈 배열 반환
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('반환된 배송지는 UserAddress 엔티티 인스턴스다', async () => {
        // Given: 사용자 존재, 배송지 존재
        const addresses = [mockAddress];
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByUserId.mockResolvedValue(addresses);

        // When: getAddressList 호출
        const result = await service.getAddressList(1);

        // Then: UserAddress 인스턴스 반환
        expect(result[0]).toBeInstanceOf(UserAddress);
        expect(result[0].id).toBe(1);
        expect(result[0].recipientName).toBe('홍길동');
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(service.getAddressList(999)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
        expect(mockUserAddressRepository.findByUserId).not.toHaveBeenCalled();
      });
    });
  });

  describe('FR-U-005: getAddressDetail', () => {
    describe('성공 케이스', () => {
      it('사용자 ID와 배송지 ID로 배송지를 조회할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 존재
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );

        // When: getAddressDetail(1, 1) 호출
        const result = await service.getAddressDetail(1, 1);

        // Then: 배송지 반환
        expect(result).toEqual(mockAddress);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(
          mockUserAddressRepository.findByIdAndUserId,
        ).toHaveBeenCalledWith(1, 1);
      });

      it('반환된 배송지는 UserAddress 엔티티 인스턴스다', async () => {
        // Given: 사용자 존재, 배송지 존재
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );

        // When: getAddressDetail 호출
        const result = await service.getAddressDetail(1, 1);

        // Then: UserAddress 인스턴스 반환
        expect(result).toBeInstanceOf(UserAddress);
        expect(result.id).toBe(1);
        expect(result.recipientName).toBe('홍길동');
        expect(result.postalCode).toBe('12345');
      });
    });

    describe('실패 케이스 - 사용자 없음', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(service.getAddressDetail(999, 1)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
        expect(
          mockUserAddressRepository.findByIdAndUserId,
        ).not.toHaveBeenCalled();
      });
    });

    describe('실패 케이스 - 배송지 없음', () => {
      it('존재하지 않는 배송지 ID로 조회하면 AddressNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 999 없음
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(false);

        // When & Then: AddressNotFoundException 발생
        await expect(service.getAddressDetail(1, 999)).rejects.toThrow(
          AddressNotFoundException,
        );
        expect(mockUserAddressRepository.exists).toHaveBeenCalledWith(999);
      });

      it('AddressNotFoundException은 올바른 에러 코드(U006)를 가진다', async () => {
        // Given: 사용자 존재, 배송지 없음
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(false);

        // When & Then: 에러 코드 확인
        try {
          await service.getAddressDetail(1, 999);
          fail('Should throw AddressNotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(AddressNotFoundException);
          expect((error as AddressNotFoundException).code).toBe('U006');
        }
      });
    });

    describe('실패 케이스 - 권한 없음', () => {
      it('다른 사용자의 배송지를 조회하면 AddressAccessDeniedException을 발생시킨다', async () => {
        // Given: 사용자 1 존재, 배송지는 다른 사용자 소유
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(true);

        // When & Then: AddressAccessDeniedException 발생
        await expect(service.getAddressDetail(1, 99)).rejects.toThrow(
          AddressAccessDeniedException,
        );
        expect(mockUserAddressRepository.exists).toHaveBeenCalledWith(99);
      });

      it('AddressAccessDeniedException은 올바른 에러 코드(U007)를 가진다', async () => {
        // Given: 권한 없음
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(true);

        // When & Then: 에러 코드 확인
        try {
          await service.getAddressDetail(1, 99);
          fail('Should throw AddressAccessDeniedException');
        } catch (error) {
          expect(error).toBeInstanceOf(AddressAccessDeniedException);
          expect((error as AddressAccessDeniedException).code).toBe('U007');
        }
      });
    });
  });

  describe('FR-U-006: createAddress', () => {
    const createData = {
      recipientName: '김철수',
      recipientPhone: '010-9876-5432',
      postalCode: '54321',
      addressDefaultText: '부산시 해운대구',
      addressDetailText: '101호',
      isDefault: false,
    };

    describe('성공 케이스', () => {
      it('새로운 배송지를 생성할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 개수 5개
        const newAddress = UserAddress.create({
          id: 2,
          userId: 1,
          ...createData,
          createdAt: new Date().toISOString(),
        });
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.countByUserId.mockResolvedValue(5);
        mockUserAddressRepository.create.mockResolvedValue(newAddress);

        // When: createAddress 호출
        const result = await service.createAddress(1, createData);

        // Then: 배송지 생성 성공
        expect(result).toEqual(newAddress);
        expect(result.recipientName).toBe('김철수');
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(mockUserAddressRepository.countByUserId).toHaveBeenCalledWith(1);
        expect(mockUserAddressRepository.create).toHaveBeenCalledWith(
          expect.any(UserAddress),
        );
      });

      it('addressDetailText가 없어도 배송지를 생성할 수 있다', async () => {
        // Given: addressDetailText 없는 데이터
        const dataWithoutDetail = {
          ...createData,
          addressDetailText: undefined,
        };
        const newAddress = UserAddress.create({
          id: 2,
          userId: 1,
          ...dataWithoutDetail,
          addressDetailText: null,
          createdAt: new Date().toISOString(),
        });
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.countByUserId.mockResolvedValue(5);
        mockUserAddressRepository.create.mockResolvedValue(newAddress);

        // When: createAddress 호출
        const result = await service.createAddress(1, dataWithoutDetail);

        // Then: addressDetailText = null로 생성
        expect(result.addressDetailText).toBeNull();
      });

      it('isDefault를 true로 설정하여 기본 배송지로 생성할 수 있다', async () => {
        // Given: isDefault: true
        const defaultData = { ...createData, isDefault: true };
        const newAddress = UserAddress.create({
          id: 2,
          userId: 1,
          ...defaultData,
          createdAt: new Date().toISOString(),
        });
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.countByUserId.mockResolvedValue(5);
        mockUserAddressRepository.create.mockResolvedValue(newAddress);

        // When: createAddress 호출
        const result = await service.createAddress(1, defaultData);

        // Then: 기본 배송지로 생성
        expect(result.isDefault).toBe(true);
      });

      it('반환된 배송지는 UserAddress 엔티티 인스턴스다', async () => {
        // Given: 사용자 존재
        const newAddress = UserAddress.create({
          id: 2,
          userId: 1,
          ...createData,
          createdAt: new Date().toISOString(),
        });
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.countByUserId.mockResolvedValue(5);
        mockUserAddressRepository.create.mockResolvedValue(newAddress);

        // When: createAddress 호출
        const result = await service.createAddress(1, createData);

        // Then: UserAddress 인스턴스 반환
        expect(result).toBeInstanceOf(UserAddress);
      });
    });

    describe('실패 케이스 - 사용자 없음', () => {
      it('존재하지 않는 사용자 ID로 생성하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(service.createAddress(999, createData)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
        expect(mockUserAddressRepository.countByUserId).not.toHaveBeenCalled();
        expect(mockUserAddressRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('실패 케이스 - 최대 개수 초과', () => {
      it('배송지가 10개인 경우 MaxAddressLimitExceededException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 개수 10개
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.countByUserId.mockResolvedValue(10);

        // When & Then: MaxAddressLimitExceededException 발생
        await expect(service.createAddress(1, createData)).rejects.toThrow(
          MaxAddressLimitExceededException,
        );
        expect(mockUserAddressRepository.countByUserId).toHaveBeenCalledWith(1);
        expect(mockUserAddressRepository.create).not.toHaveBeenCalled();
      });

      it('MaxAddressLimitExceededException은 올바른 에러 코드(U008)를 가진다', async () => {
        // Given: 배송지 10개
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.countByUserId.mockResolvedValue(10);

        // When & Then: 에러 코드 확인
        try {
          await service.createAddress(1, createData);
          fail('Should throw MaxAddressLimitExceededException');
        } catch (error) {
          expect(error).toBeInstanceOf(MaxAddressLimitExceededException);
          expect((error as MaxAddressLimitExceededException).code).toBe('U008');
        }
      });
    });

    describe('도메인 로직 호출 검증', () => {
      it('createAddress 호출 시 UserAddress.create가 호출된다', async () => {
        // Given: 사용자 존재
        const newAddress = UserAddress.create({
          id: 2,
          userId: 1,
          ...createData,
          createdAt: new Date().toISOString(),
        });
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.countByUserId.mockResolvedValue(5);
        mockUserAddressRepository.create.mockResolvedValue(newAddress);

        // When: createAddress 호출
        await service.createAddress(1, createData);

        // Then: repository.create 호출됨
        expect(mockUserAddressRepository.create).toHaveBeenCalledWith(
          expect.any(UserAddress),
        );
      });
    });
  });

  describe('FR-U-007: updateAddress', () => {
    const updateData = {
      recipientName: '이영희',
      recipientPhone: '010-1111-2222',
    };

    describe('성공 케이스', () => {
      it('배송지 정보를 수정할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 존재
        const updatedAddress = UserAddress.create({
          ...mockAddress,
          recipientName: '이영희',
          recipientPhone: '010-1111-2222',
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );
        mockUserAddressRepository.update.mockResolvedValue(updatedAddress);

        // When: updateAddress 호출
        const result = await service.updateAddress(1, 1, updateData);

        // Then: 배송지 수정 성공
        expect(result.recipientName).toBe('이영희');
        expect(result.recipientPhone).toBe('010-1111-2222');
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(
          mockUserAddressRepository.findByIdAndUserId,
        ).toHaveBeenCalledWith(1, 1);
        expect(mockUserAddressRepository.update).toHaveBeenCalledWith(
          1,
          expect.any(UserAddress),
        );
      });

      it('일부 필드만 수정할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 존재
        const partialUpdate = { recipientName: '박민수' };
        const updatedAddress = UserAddress.create({
          ...mockAddress,
          recipientName: '박민수',
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );
        mockUserAddressRepository.update.mockResolvedValue(updatedAddress);

        // When: 일부 필드만 수정
        const result = await service.updateAddress(1, 1, partialUpdate);

        // Then: 해당 필드만 변경
        expect(result.recipientName).toBe('박민수');
      });

      it('반환된 배송지는 UserAddress 엔티티 인스턴스다', async () => {
        // Given: 사용자 존재, 배송지 존재
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );
        mockUserAddressRepository.update.mockResolvedValue(mockAddress);

        // When: updateAddress 호출
        const result = await service.updateAddress(1, 1, updateData);

        // Then: UserAddress 인스턴스 반환
        expect(result).toBeInstanceOf(UserAddress);
      });
    });

    describe('실패 케이스 - 사용자 없음', () => {
      it('존재하지 않는 사용자 ID로 수정하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(service.updateAddress(999, 1, updateData)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
        expect(
          mockUserAddressRepository.findByIdAndUserId,
        ).not.toHaveBeenCalled();
        expect(mockUserAddressRepository.update).not.toHaveBeenCalled();
      });
    });

    describe('실패 케이스 - 배송지 없음', () => {
      it('존재하지 않는 배송지 ID로 수정하면 AddressNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 999 없음
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(false);

        // When & Then: AddressNotFoundException 발생
        await expect(service.updateAddress(1, 999, updateData)).rejects.toThrow(
          AddressNotFoundException,
        );
        expect(mockUserAddressRepository.exists).toHaveBeenCalledWith(999);
        expect(mockUserAddressRepository.update).not.toHaveBeenCalled();
      });

      it('업데이트 후 배송지가 없으면 AddressNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 존재하나 업데이트 실패
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );
        mockUserAddressRepository.update.mockResolvedValue(null);

        // When & Then: AddressNotFoundException 발생
        await expect(service.updateAddress(1, 1, updateData)).rejects.toThrow(
          AddressNotFoundException,
        );
      });
    });

    describe('실패 케이스 - 권한 없음', () => {
      it('다른 사용자의 배송지를 수정하면 AddressAccessDeniedException을 발생시킨다', async () => {
        // Given: 사용자 1 존재, 배송지는 다른 사용자 소유
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(true);

        // When & Then: AddressAccessDeniedException 발생
        await expect(service.updateAddress(1, 99, updateData)).rejects.toThrow(
          AddressAccessDeniedException,
        );
        expect(mockUserAddressRepository.exists).toHaveBeenCalledWith(99);
        expect(mockUserAddressRepository.update).not.toHaveBeenCalled();
      });
    });

    describe('도메인 로직 호출 검증', () => {
      it('updateAddress 호출 시 UserAddress 엔티티의 update 메서드가 호출된다', async () => {
        // Given: 사용자 존재, 배송지 존재
        const addressSpy = jest.spyOn(mockAddress, 'update');
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );
        mockUserAddressRepository.update.mockResolvedValue(mockAddress);

        // When: updateAddress 호출
        await service.updateAddress(1, 1, updateData);

        // Then: UserAddress 엔티티의 update 메서드 호출됨
        expect(addressSpy).toHaveBeenCalledWith(updateData);
      });
    });
  });

  describe('FR-U-008: deleteAddress', () => {
    describe('성공 케이스', () => {
      it('배송지를 삭제할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 존재
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );
        mockUserAddressRepository.delete.mockResolvedValue(true);

        // When: deleteAddress 호출
        await service.deleteAddress(1, 1);

        // Then: 삭제 성공
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(
          mockUserAddressRepository.findByIdAndUserId,
        ).toHaveBeenCalledWith(1, 1);
        expect(mockUserAddressRepository.delete).toHaveBeenCalledWith(1);
      });

      it('기본 배송지를 삭제할 수 있다', async () => {
        // Given: 사용자 존재, 기본 배송지 존재
        const defaultAddress = UserAddress.create({
          ...mockAddress,
          isDefault: true,
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          defaultAddress,
        );
        mockUserAddressRepository.delete.mockResolvedValue(true);

        // When: deleteAddress 호출
        await service.deleteAddress(1, 1);

        // Then: 삭제 성공 (Repository에서 자동으로 다른 배송지를 기본으로 설정)
        expect(mockUserAddressRepository.delete).toHaveBeenCalledWith(1);
      });
    });

    describe('실패 케이스 - 사용자 없음', () => {
      it('존재하지 않는 사용자 ID로 삭제하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(service.deleteAddress(999, 1)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
        expect(
          mockUserAddressRepository.findByIdAndUserId,
        ).not.toHaveBeenCalled();
        expect(mockUserAddressRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('실패 케이스 - 배송지 없음', () => {
      it('존재하지 않는 배송지 ID로 삭제하면 AddressNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 999 없음
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(false);

        // When & Then: AddressNotFoundException 발생
        await expect(service.deleteAddress(1, 999)).rejects.toThrow(
          AddressNotFoundException,
        );
        expect(mockUserAddressRepository.exists).toHaveBeenCalledWith(999);
        expect(mockUserAddressRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('실패 케이스 - 권한 없음', () => {
      it('다른 사용자의 배송지를 삭제하면 AddressAccessDeniedException을 발생시킨다', async () => {
        // Given: 사용자 1 존재, 배송지는 다른 사용자 소유
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(true);

        // When & Then: AddressAccessDeniedException 발생
        await expect(service.deleteAddress(1, 99)).rejects.toThrow(
          AddressAccessDeniedException,
        );
        expect(mockUserAddressRepository.exists).toHaveBeenCalledWith(99);
        expect(mockUserAddressRepository.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('FR-U-009: setDefaultAddress', () => {
    describe('성공 케이스', () => {
      it('배송지를 기본 배송지로 설정할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 존재
        const defaultAddress = UserAddress.create({
          ...mockAddress,
          isDefault: true,
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );
        mockUserAddressRepository.setDefaultAddress.mockResolvedValue(
          defaultAddress,
        );

        // When: setDefaultAddress 호출
        const result = await service.setDefaultAddress(1, 1);

        // Then: 기본 배송지로 설정 성공
        expect(result.isDefault).toBe(true);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(
          mockUserAddressRepository.findByIdAndUserId,
        ).toHaveBeenCalledWith(1, 1);
        expect(
          mockUserAddressRepository.setDefaultAddress,
        ).toHaveBeenCalledWith(1, 1);
      });

      it('반환된 배송지는 UserAddress 엔티티 인스턴스다', async () => {
        // Given: 사용자 존재, 배송지 존재
        const defaultAddress = UserAddress.create({
          ...mockAddress,
          isDefault: true,
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(
          mockAddress,
        );
        mockUserAddressRepository.setDefaultAddress.mockResolvedValue(
          defaultAddress,
        );

        // When: setDefaultAddress 호출
        const result = await service.setDefaultAddress(1, 1);

        // Then: UserAddress 인스턴스 반환
        expect(result).toBeInstanceOf(UserAddress);
      });
    });

    describe('실패 케이스 - 사용자 없음', () => {
      it('존재하지 않는 사용자 ID로 설정하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(service.setDefaultAddress(999, 1)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
        expect(
          mockUserAddressRepository.findByIdAndUserId,
        ).not.toHaveBeenCalled();
        expect(
          mockUserAddressRepository.setDefaultAddress,
        ).not.toHaveBeenCalled();
      });
    });

    describe('실패 케이스 - 배송지 없음', () => {
      it('존재하지 않는 배송지 ID로 설정하면 AddressNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 999 없음
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(false);

        // When & Then: AddressNotFoundException 발생
        await expect(service.setDefaultAddress(1, 999)).rejects.toThrow(
          AddressNotFoundException,
        );
        expect(mockUserAddressRepository.exists).toHaveBeenCalledWith(999);
        expect(
          mockUserAddressRepository.setDefaultAddress,
        ).not.toHaveBeenCalled();
      });
    });

    describe('실패 케이스 - 권한 없음', () => {
      it('다른 사용자의 배송지를 기본으로 설정하면 AddressAccessDeniedException을 발생시킨다', async () => {
        // Given: 사용자 1 존재, 배송지는 다른 사용자 소유
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findByIdAndUserId.mockResolvedValue(null);
        mockUserAddressRepository.exists.mockResolvedValue(true);

        // When & Then: AddressAccessDeniedException 발생
        await expect(service.setDefaultAddress(1, 99)).rejects.toThrow(
          AddressAccessDeniedException,
        );
        expect(mockUserAddressRepository.exists).toHaveBeenCalledWith(99);
        expect(
          mockUserAddressRepository.setDefaultAddress,
        ).not.toHaveBeenCalled();
      });
    });
  });

  describe('FR-U-010: getDefaultAddress', () => {
    describe('성공 케이스', () => {
      it('사용자의 기본 배송지를 조회할 수 있다', async () => {
        // Given: 사용자 존재, 기본 배송지 존재
        const defaultAddress = UserAddress.create({
          ...mockAddress,
          isDefault: true,
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findDefaultByUserId.mockResolvedValue(
          defaultAddress,
        );

        // When: getDefaultAddress(1) 호출
        const result = await service.getDefaultAddress(1);

        // Then: 기본 배송지 반환
        expect(result).toEqual(defaultAddress);
        expect(result!.isDefault).toBe(true);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
        expect(
          mockUserAddressRepository.findDefaultByUserId,
        ).toHaveBeenCalledWith(1);
      });

      it('기본 배송지가 없으면 null을 반환한다', async () => {
        // Given: 사용자 존재, 기본 배송지 없음
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findDefaultByUserId.mockResolvedValue(null);

        // When: getDefaultAddress 호출
        const result = await service.getDefaultAddress(1);

        // Then: null 반환
        expect(result).toBeNull();
        expect(
          mockUserAddressRepository.findDefaultByUserId,
        ).toHaveBeenCalledWith(1);
      });

      it('반환된 배송지는 UserAddress 엔티티 인스턴스다', async () => {
        // Given: 사용자 존재, 기본 배송지 존재
        const defaultAddress = UserAddress.create({
          ...mockAddress,
          isDefault: true,
        } as any);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockUserAddressRepository.findDefaultByUserId.mockResolvedValue(
          defaultAddress,
        );

        // When: getDefaultAddress 호출
        const result = await service.getDefaultAddress(1);

        // Then: UserAddress 인스턴스 반환
        expect(result).toBeInstanceOf(UserAddress);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: repository에 사용자 999 없음
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then: UserNotFoundException 발생
        await expect(service.getDefaultAddress(999)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
        expect(
          mockUserAddressRepository.findDefaultByUserId,
        ).not.toHaveBeenCalled();
      });
    });
  });
});
