import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../application/user.service';
import { User } from '../domain/entities/user.entity';
import { UserAddress } from '../domain/entities/user-address.entity';
import {
  UserNotFoundException,
  AddressNotFoundException,
  AddressAccessDeniedException,
  MaxAddressLimitExceededException,
} from '../domain/exceptions';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getUserById: jest.fn(),
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            getAddressList: jest.fn(),
            getAddressDetail: jest.fn(),
            createAddress: jest.fn(),
            updateAddress: jest.fn(),
            deleteAddress: jest.fn(),
            setDefaultAddress: jest.fn(),
            getDefaultAddress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /user/:id - getUserById', () => {
    describe('성공 케이스', () => {
      it('사용자 ID로 사용자 정보를 조회할 수 있다', async () => {
        // Given: 사용자 1 존재
        jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser);

        // When: getUserById(1) 호출
        const result = await controller.getUserById(1);

        // Then: DTO 형식으로 반환
        expect(result).toEqual({
          userId: 1,
          email: 'test@example.com',
          profile: {
            name: '홍길동',
            displayName: '길동이',
            phoneNumber: '010-1234-5678',
          },
          createdAt: '2024-01-01T00:00:00.000Z',
        });
        expect(service.getUserById).toHaveBeenCalledWith(1);
        expect(service.getUserById).toHaveBeenCalledTimes(1);
      });

      it('반환된 데이터에는 필수 필드가 모두 포함되어 있다', async () => {
        // Given: 사용자 존재
        jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser);

        // When: getUserById 호출
        const result = await controller.getUserById(1);

        // Then: 필수 필드 확인
        expect(result.userId).toBeDefined();
        expect(result.email).toBeDefined();
        expect(result.profile).toBeDefined();
        expect(result.profile.name).toBeDefined();
        expect(result.createdAt).toBeDefined();
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'getUserById')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(controller.getUserById(999)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(service.getUserById).toHaveBeenCalledWith(999);
      });
    });
  });

  describe('GET /user/:id/profile - getProfile', () => {
    describe('성공 케이스', () => {
      it('사용자 ID로 프로필을 조회할 수 있다', async () => {
        // Given: 사용자 1 존재
        jest.spyOn(service, 'getProfile').mockResolvedValue(mockUser);

        // When: getProfile(1) 호출
        const result = await controller.getProfile(1);

        // Then: 프로필 DTO 반환
        expect(result).toEqual({
          userId: 1,
          name: '홍길동',
          displayName: '길동이',
          phoneNumber: '010-1234-5678',
          updatedAt: null,
        });
        expect(service.getProfile).toHaveBeenCalledWith(1);
        expect(service.getProfile).toHaveBeenCalledTimes(1);
      });

      it('반환된 프로필에는 수정 가능한 필드가 모두 포함되어 있다', async () => {
        // Given: 사용자 존재
        jest.spyOn(service, 'getProfile').mockResolvedValue(mockUser);

        // When: getProfile 호출
        const result = await controller.getProfile(1);

        // Then: 수정 가능한 필드 확인
        expect(result.name).toBe('홍길동');
        expect(result.displayName).toBe('길동이');
        expect(result.phoneNumber).toBe('010-1234-5678');
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'getProfile')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(controller.getProfile(999)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(service.getProfile).toHaveBeenCalledWith(999);
      });
    });
  });

  describe('PATCH /user/:id/profile - updateProfile', () => {
    const updateDto = {
      name: '김철수',
      displayName: '철수',
      recipientPhone: '010-9876-5432',
    };

    describe('성공 케이스', () => {
      it('프로필 정보를 수정할 수 있다', async () => {
        // Given: 사용자 존재, 수정 데이터
        const updatedUser = User.create({
          ...mockUser,
          name: '김철수',
          displayName: '철수',
          phoneNumber: '010-9876-5432',
          updatedAt: '2024-01-02T00:00:00.000Z',
        } as any);
        jest.spyOn(service, 'updateProfile').mockResolvedValue(updatedUser);

        // When: updateProfile 호출
        const result = await controller.updateProfile(1, updateDto);

        // Then: 수정된 프로필 반환
        expect(result).toEqual({
          userId: 1,
          name: '김철수',
          displayName: '철수',
          phoneNumber: '010-9876-5432',
          updatedAt: '2024-01-02T00:00:00.000Z',
        });
        expect(service.updateProfile).toHaveBeenCalledWith(1, updateDto);
      });

      it('일부 필드만 수정할 수 있다', async () => {
        // Given: 사용자 존재, 일부 필드만 수정
        const partialDto = { name: '이영희' };
        const updatedUser = User.create({
          ...mockUser,
          name: '이영희',
          updatedAt: '2024-01-02T00:00:00.000Z',
        } as any);
        jest.spyOn(service, 'updateProfile').mockResolvedValue(updatedUser);

        // When: 일부 필드만 수정
        const result = await controller.updateProfile(1, partialDto);

        // Then: 해당 필드만 변경
        expect(result.name).toBe('이영희');
        expect(service.updateProfile).toHaveBeenCalledWith(1, partialDto);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 수정하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'updateProfile')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(controller.updateProfile(999, updateDto)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(service.updateProfile).toHaveBeenCalledWith(999, updateDto);
      });
    });
  });

  describe('GET /user/:id/address - getAddressList', () => {
    describe('성공 케이스', () => {
      it('사용자의 모든 배송지를 조회할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 3개
        const addresses = [mockAddress, mockAddress, mockAddress];
        jest.spyOn(service, 'getAddressList').mockResolvedValue(addresses);

        // When: getAddressList(1) 호출
        const result = await controller.getAddressList(1);

        // Then: 배송지 목록 DTO 반환
        expect(result).toEqual({
          userId: 1,
          addresses: [
            {
              addressId: 1,
              recipientName: '홍길동',
              recipientPhone: '010-1234-5678',
              postalCode: '12345',
              addressDefaultText: '서울시 강남구 테헤란로 123',
              addressDetailText: '456호',
              isDefault: true,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
            {
              addressId: 1,
              recipientName: '홍길동',
              recipientPhone: '010-1234-5678',
              postalCode: '12345',
              addressDefaultText: '서울시 강남구 테헤란로 123',
              addressDetailText: '456호',
              isDefault: true,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
            {
              addressId: 1,
              recipientName: '홍길동',
              recipientPhone: '010-1234-5678',
              postalCode: '12345',
              addressDefaultText: '서울시 강남구 테헤란로 123',
              addressDetailText: '456호',
              isDefault: true,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        });
        expect(service.getAddressList).toHaveBeenCalledWith(1);
      });

      it('배송지가 없는 경우 빈 배열을 반환한다', async () => {
        // Given: 사용자 존재, 배송지 없음
        jest.spyOn(service, 'getAddressList').mockResolvedValue([]);

        // When: getAddressList 호출
        const result = await controller.getAddressList(1);

        // Then: 빈 배열 반환
        expect(result.addresses).toEqual([]);
        expect(result.addresses).toHaveLength(0);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'getAddressList')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(controller.getAddressList(999)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(service.getAddressList).toHaveBeenCalledWith(999);
      });
    });
  });

  describe('GET /user/:id/address/:addressId - getAddressDetail', () => {
    describe('성공 케이스', () => {
      it('배송지 상세 정보를 조회할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 존재
        jest.spyOn(service, 'getAddressDetail').mockResolvedValue(mockAddress);

        // When: getAddressDetail(1, 1) 호출
        const result = await controller.getAddressDetail(1, 1);

        // Then: 배송지 상세 DTO 반환
        expect(result).toEqual({
          addressId: 1,
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
        expect(service.getAddressDetail).toHaveBeenCalledWith(1, 1);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'getAddressDetail')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(controller.getAddressDetail(999, 1)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(service.getAddressDetail).toHaveBeenCalledWith(999, 1);
      });

      it('존재하지 않는 배송지 ID로 조회하면 AddressNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 999 없음
        jest
          .spyOn(service, 'getAddressDetail')
          .mockRejectedValue(new AddressNotFoundException(999));

        // When & Then: AddressNotFoundException 발생
        await expect(controller.getAddressDetail(1, 999)).rejects.toThrow(
          AddressNotFoundException,
        );
        expect(service.getAddressDetail).toHaveBeenCalledWith(1, 999);
      });

      it('다른 사용자의 배송지를 조회하면 AddressAccessDeniedException을 발생시킨다', async () => {
        // Given: 사용자 1 존재, 배송지는 다른 사용자 소유
        jest
          .spyOn(service, 'getAddressDetail')
          .mockRejectedValue(new AddressAccessDeniedException(99));

        // When & Then: AddressAccessDeniedException 발생
        await expect(controller.getAddressDetail(1, 99)).rejects.toThrow(
          AddressAccessDeniedException,
        );
        expect(service.getAddressDetail).toHaveBeenCalledWith(1, 99);
      });
    });
  });

  describe('POST /user/:id/address - createAddress', () => {
    const createDto = {
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
          ...createDto,
          createdAt: '2024-01-02T00:00:00.000Z',
        });
        jest.spyOn(service, 'createAddress').mockResolvedValue(newAddress);

        // When: createAddress 호출
        const result = await controller.createAddress(1, createDto);

        // Then: 생성된 배송지 DTO 반환
        expect(result).toEqual({
          addressId: 2,
          userId: 1,
          recipientName: '김철수',
          recipientPhone: '010-9876-5432',
          postalCode: '54321',
          addressDefaultText: '부산시 해운대구',
          addressDetailText: '101호',
          isDefault: false,
          createdAt: '2024-01-02T00:00:00.000Z',
        });
        expect(service.createAddress).toHaveBeenCalledWith(1, createDto);
      });

      it('addressDetailText가 없어도 배송지를 생성할 수 있다', async () => {
        // Given: addressDetailText 없는 데이터
        const dtoWithoutDetail = { ...createDto, addressDetailText: undefined };
        const newAddress = UserAddress.create({
          id: 2,
          userId: 1,
          ...dtoWithoutDetail,
          addressDetailText: null,
          createdAt: '2024-01-02T00:00:00.000Z',
        });
        jest.spyOn(service, 'createAddress').mockResolvedValue(newAddress);

        // When: createAddress 호출
        const result = await controller.createAddress(1, dtoWithoutDetail);

        // Then: addressDetailText = null
        expect(result.addressDetailText).toBeNull();
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 생성하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'createAddress')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(controller.createAddress(999, createDto)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(service.createAddress).toHaveBeenCalledWith(999, createDto);
      });

      it('배송지가 10개인 경우 MaxAddressLimitExceededException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 10개
        jest
          .spyOn(service, 'createAddress')
          .mockRejectedValue(new MaxAddressLimitExceededException());

        // When & Then: MaxAddressLimitExceededException 발생
        await expect(controller.createAddress(1, createDto)).rejects.toThrow(
          MaxAddressLimitExceededException,
        );
        expect(service.createAddress).toHaveBeenCalledWith(1, createDto);
      });
    });
  });

  describe('PATCH /user/:id/address/:addressId - updateAddress', () => {
    const updateDto = {
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
          updatedAt: '2024-01-02T00:00:00.000Z',
        } as any);
        jest.spyOn(service, 'updateAddress').mockResolvedValue(updatedAddress);

        // When: updateAddress 호출
        const result = await controller.updateAddress(1, 1, updateDto);

        // Then: 수정된 배송지 DTO 반환
        expect(result).toEqual({
          addressId: 1,
          userId: 1,
          recipientName: '이영희',
          recipientPhone: '010-1111-2222',
          postalCode: '12345',
          addressDefaultText: '서울시 강남구 테헤란로 123',
          addressDetailText: '456호',
          isDefault: true,
          updatedAt: '2024-01-02T00:00:00.000Z',
        });
        expect(service.updateAddress).toHaveBeenCalledWith(1, 1, updateDto);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 수정하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'updateAddress')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(
          controller.updateAddress(999, 1, updateDto),
        ).rejects.toThrow(UserNotFoundException);
        expect(service.updateAddress).toHaveBeenCalledWith(999, 1, updateDto);
      });

      it('존재하지 않는 배송지 ID로 수정하면 AddressNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 999 없음
        jest
          .spyOn(service, 'updateAddress')
          .mockRejectedValue(new AddressNotFoundException(999));

        // When & Then: AddressNotFoundException 발생
        await expect(
          controller.updateAddress(1, 999, updateDto),
        ).rejects.toThrow(AddressNotFoundException);
        expect(service.updateAddress).toHaveBeenCalledWith(1, 999, updateDto);
      });

      it('다른 사용자의 배송지를 수정하면 AddressAccessDeniedException을 발생시킨다', async () => {
        // Given: 사용자 1 존재, 배송지는 다른 사용자 소유
        jest
          .spyOn(service, 'updateAddress')
          .mockRejectedValue(new AddressAccessDeniedException(99));

        // When & Then: AddressAccessDeniedException 발생
        await expect(
          controller.updateAddress(1, 99, updateDto),
        ).rejects.toThrow(AddressAccessDeniedException);
        expect(service.updateAddress).toHaveBeenCalledWith(1, 99, updateDto);
      });
    });
  });

  describe('DELETE /user/:id/address/:addressId - deleteAddress', () => {
    describe('성공 케이스', () => {
      it('배송지를 삭제할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 존재
        jest.spyOn(service, 'deleteAddress').mockResolvedValue(undefined);

        // When: deleteAddress 호출
        const result = await controller.deleteAddress(1, 1);

        // Then: 삭제 성공 응답
        expect(result).toEqual({
          success: true,
          deletedAddressId: 1,
        });
        expect(service.deleteAddress).toHaveBeenCalledWith(1, 1);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 삭제하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'deleteAddress')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(controller.deleteAddress(999, 1)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(service.deleteAddress).toHaveBeenCalledWith(999, 1);
      });

      it('존재하지 않는 배송지 ID로 삭제하면 AddressNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 999 없음
        jest
          .spyOn(service, 'deleteAddress')
          .mockRejectedValue(new AddressNotFoundException(999));

        // When & Then: AddressNotFoundException 발생
        await expect(controller.deleteAddress(1, 999)).rejects.toThrow(
          AddressNotFoundException,
        );
        expect(service.deleteAddress).toHaveBeenCalledWith(1, 999);
      });

      it('다른 사용자의 배송지를 삭제하면 AddressAccessDeniedException을 발생시킨다', async () => {
        // Given: 사용자 1 존재, 배송지는 다른 사용자 소유
        jest
          .spyOn(service, 'deleteAddress')
          .mockRejectedValue(new AddressAccessDeniedException(99));

        // When & Then: AddressAccessDeniedException 발생
        await expect(controller.deleteAddress(1, 99)).rejects.toThrow(
          AddressAccessDeniedException,
        );
        expect(service.deleteAddress).toHaveBeenCalledWith(1, 99);
      });
    });
  });

  describe('PATCH /user/:id/address/:addressId/default - setDefaultAddress', () => {
    describe('성공 케이스', () => {
      it('배송지를 기본 배송지로 설정할 수 있다', async () => {
        // Given: 사용자 존재, 배송지 존재
        const defaultAddress = UserAddress.create({
          ...mockAddress,
          isDefault: true,
        } as any);
        jest
          .spyOn(service, 'setDefaultAddress')
          .mockResolvedValue(defaultAddress);

        // When: setDefaultAddress 호출
        const result = await controller.setDefaultAddress(1, 1);

        // Then: 설정 성공 응답
        expect(result).toEqual({
          addressId: 1,
          success: true,
        });
        expect(service.setDefaultAddress).toHaveBeenCalledWith(1, 1);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 설정하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'setDefaultAddress')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(controller.setDefaultAddress(999, 1)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(service.setDefaultAddress).toHaveBeenCalledWith(999, 1);
      });

      it('존재하지 않는 배송지 ID로 설정하면 AddressNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 존재, 배송지 999 없음
        jest
          .spyOn(service, 'setDefaultAddress')
          .mockRejectedValue(new AddressNotFoundException(999));

        // When & Then: AddressNotFoundException 발생
        await expect(controller.setDefaultAddress(1, 999)).rejects.toThrow(
          AddressNotFoundException,
        );
        expect(service.setDefaultAddress).toHaveBeenCalledWith(1, 999);
      });

      it('다른 사용자의 배송지를 기본으로 설정하면 AddressAccessDeniedException을 발생시킨다', async () => {
        // Given: 사용자 1 존재, 배송지는 다른 사용자 소유
        jest
          .spyOn(service, 'setDefaultAddress')
          .mockRejectedValue(new AddressAccessDeniedException(99));

        // When & Then: AddressAccessDeniedException 발생
        await expect(controller.setDefaultAddress(1, 99)).rejects.toThrow(
          AddressAccessDeniedException,
        );
        expect(service.setDefaultAddress).toHaveBeenCalledWith(1, 99);
      });
    });
  });

  describe('GET /user/:id/address/default - getDefaultAddress', () => {
    describe('성공 케이스', () => {
      it('사용자의 기본 배송지를 조회할 수 있다', async () => {
        // Given: 사용자 존재, 기본 배송지 존재
        const defaultAddress = UserAddress.create({
          ...mockAddress,
          isDefault: true,
        } as any);
        jest
          .spyOn(service, 'getDefaultAddress')
          .mockResolvedValue(defaultAddress);

        // When: getDefaultAddress(1) 호출
        const result = await controller.getDefaultAddress(1);

        // Then: 기본 배송지 DTO 반환
        expect(result).toEqual({
          addressId: 1,
          userId: 1,
          recipientName: '홍길동',
          recipientPhone: '010-1234-5678',
          postalCode: '12345',
          addressDefaultText: '서울시 강남구 테헤란로 123',
          addressDetailText: '456호',
          isDefault: true,
        });
        expect(service.getDefaultAddress).toHaveBeenCalledWith(1);
      });

      it('기본 배송지가 없으면 null을 반환한다', async () => {
        // Given: 사용자 존재, 기본 배송지 없음
        jest.spyOn(service, 'getDefaultAddress').mockResolvedValue(null);

        // When: getDefaultAddress 호출
        const result = await controller.getDefaultAddress(1);

        // Then: null 반환
        expect(result).toBeNull();
        expect(service.getDefaultAddress).toHaveBeenCalledWith(1);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 사용자 ID로 조회하면 UserNotFoundException을 발생시킨다', async () => {
        // Given: 사용자 999 없음
        jest
          .spyOn(service, 'getDefaultAddress')
          .mockRejectedValue(new UserNotFoundException(999));

        // When & Then: UserNotFoundException 발생
        await expect(controller.getDefaultAddress(999)).rejects.toThrow(
          UserNotFoundException,
        );
        expect(service.getDefaultAddress).toHaveBeenCalledWith(999);
      });
    });
  });
});
