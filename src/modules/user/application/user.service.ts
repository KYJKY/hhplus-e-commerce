import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/entities/user.entity';
import type { IUserRepository } from '../domain/repositories/user.repository.interface';
import type { IUserAddressRepository } from '../domain/repositories/user-address.repository.interface';
import {
  UserNotFoundException,
  AddressNotFoundException,
  AddressAccessDeniedException,
  MaxAddressLimitExceededException,
} from '../domain/exceptions';
import type { UpdateUserProfileProps } from '../domain/entities/user.entity';
import { UserAddress } from '../domain/entities/user-address.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IUserAddressRepository')
    private readonly userAddressRepository: IUserAddressRepository,
  ) {}

  /**
   * FR-U-001: 사용자 ID로 사용자 정보 조회
   * @param userId - 사용자 ID
   */
  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }

  /**
   * FR-U-002: 프로필 조회
   * @param userId - 사용자 ID
   */
  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }

  /**
   * FR-U-003: 프로필 수정
   * @param userId - 사용자 ID
   * @param updateData - 수정할 프로필 데이터
   */
  async updateProfile(
    userId: number,
    updateData: UpdateUserProfileProps,
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 도메인 엔티티의 updateProfile 메서드 호출 (검증 포함)
    user.updateProfile(updateData);

    // Repository를 통해 업데이트
    const updatedUser = await this.userRepository.update(userId, user);
    if (!updatedUser) {
      throw new UserNotFoundException(userId);
    }

    return updatedUser;
  }

  /**
   * FR-U-004: 배송지 목록 조회
   * @param userId - 사용자 ID
   */
  async getAddressList(userId: number): Promise<UserAddress[]> {
    // 사용자 존재 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return await this.userAddressRepository.findByUserId(userId);
  }

  /**
   * FR-U-005: 배송지 상세 조회
   * @param userId - 사용자 ID
   * @param addressId - 배송지 ID
   */
  async getAddressDetail(
    userId: number,
    addressId: number,
  ): Promise<UserAddress> {
    // 사용자 존재 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const address = await this.userAddressRepository.findByIdAndUserId(
      addressId,
      userId,
    );
    if (!address) {
      // 배송지가 존재하지 않거나 권한이 없는 경우
      const addressExists = await this.userAddressRepository.exists(addressId);
      if (addressExists) {
        throw new AddressAccessDeniedException(addressId);
      }
      throw new AddressNotFoundException(addressId);
    }

    return address;
  }

  /**
   * FR-U-006: 배송지 추가
   * @param userId - 사용자 ID
   * @param addressData - 배송지 데이터
   */
  async createAddress(
    userId: number,
    addressData: {
      recipientName: string;
      recipientPhone: string;
      postalCode: string;
      addressDefaultText: string;
      addressDetailText?: string;
      isDefault?: boolean;
    },
  ): Promise<UserAddress> {
    // 사용자 존재 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 배송지 개수 확인 (최대 10개)
    const addressCount = await this.userAddressRepository.countByUserId(userId);
    if (addressCount >= 10) {
      throw new MaxAddressLimitExceededException();
    }

    // UserAddress 엔티티 생성 (검증 포함)
    const newAddress = UserAddress.create({
      id: 0, // Repository에서 자동 생성
      userId,
      recipientName: addressData.recipientName,
      recipientPhone: addressData.recipientPhone,
      postalCode: addressData.postalCode,
      addressDefaultText: addressData.addressDefaultText,
      addressDetailText: addressData.addressDetailText ?? null,
      isDefault: addressData.isDefault ?? false,
      createdAt: new Date().toISOString(),
    });

    // Repository를 통해 생성 (첫 번째 배송지는 자동으로 기본 배송지로 설정)
    return await this.userAddressRepository.create(newAddress);
  }

  /**
   * FR-U-007: 배송지 수정
   * @param userId - 사용자 ID
   * @param addressId - 배송지 ID
   * @param updateData - 수정할 배송지 데이터
   */
  async updateAddress(
    userId: number,
    addressId: number,
    updateData: {
      recipientName?: string;
      recipientPhone?: string;
      postalCode?: string;
      addressDefaultText?: string;
      addressDetailText?: string;
    },
  ): Promise<UserAddress> {
    // 사용자 존재 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 배송지 조회 및 권한 확인
    const address = await this.userAddressRepository.findByIdAndUserId(
      addressId,
      userId,
    );
    if (!address) {
      const addressExists = await this.userAddressRepository.exists(addressId);
      if (addressExists) {
        throw new AddressAccessDeniedException(addressId);
      }
      throw new AddressNotFoundException(addressId);
    }

    // 도메인 엔티티의 update 메서드 호출 (검증 포함)
    address.update(updateData);

    // Repository를 통해 업데이트
    const updatedAddress = await this.userAddressRepository.update(
      addressId,
      address,
    );
    if (!updatedAddress) {
      throw new AddressNotFoundException(addressId);
    }

    return updatedAddress;
  }

  /**
   * FR-U-008: 배송지 삭제
   * @param userId - 사용자 ID
   * @param addressId - 배송지 ID
   */
  async deleteAddress(userId: number, addressId: number): Promise<void> {
    // 사용자 존재 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 배송지 조회 및 권한 확인
    const address = await this.userAddressRepository.findByIdAndUserId(
      addressId,
      userId,
    );
    if (!address) {
      const addressExists = await this.userAddressRepository.exists(addressId);
      if (addressExists) {
        throw new AddressAccessDeniedException(addressId);
      }
      throw new AddressNotFoundException(addressId);
    }

    // Repository를 통해 삭제 (기본 배송지 자동 관리 포함)
    await this.userAddressRepository.delete(addressId);
  }

  /**
   * FR-U-009: 기본 배송지 설정
   * @param userId - 사용자 ID
   * @param addressId - 배송지 ID
   */
  async setDefaultAddress(
    userId: number,
    addressId: number,
  ): Promise<UserAddress> {
    // 사용자 존재 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 배송지 조회 및 권한 확인
    const address = await this.userAddressRepository.findByIdAndUserId(
      addressId,
      userId,
    );
    if (!address) {
      const addressExists = await this.userAddressRepository.exists(addressId);
      if (addressExists) {
        throw new AddressAccessDeniedException(addressId);
      }
      throw new AddressNotFoundException(addressId);
    }

    // Repository를 통해 기본 배송지 설정 (기존 기본 배송지 해제 포함)
    return await this.userAddressRepository.setDefaultAddress(
      userId,
      addressId,
    );
  }

  /**
   * FR-U-010: 기본 배송지 조회
   * @param userId - 사용자 ID
   */
  async getDefaultAddress(userId: number): Promise<UserAddress | null> {
    // 사용자 존재 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return await this.userAddressRepository.findDefaultByUserId(userId);
  }

  /**
   * 포인트 충전 (내부 API)
   * @param userId - 사용자 ID
   * @param amount - 충전할 포인트
   */
  async chargeUserPoint(
    userId: number,
    amount: number,
  ): Promise<{
    previousBalance: number;
    currentBalance: number;
  }> {
    const user = await this.getUserById(userId);
    const previousBalance = user.getPoint();

    user.chargePoint(amount);
    await this.userRepository.update(userId, user);

    const currentBalance = user.getPoint();

    return {
      previousBalance,
      currentBalance,
    };
  }

  /**
   * 포인트 차감 (내부 API)
   * @param userId - 사용자 ID
   * @param amount - 차감할 포인트
   */
  async deductUserPoint(
    userId: number,
    amount: number,
  ): Promise<{
    previousBalance: number;
    currentBalance: number;
  }> {
    const user = await this.getUserById(userId);
    const previousBalance = user.getPoint();

    user.deductPoint(amount);
    await this.userRepository.update(userId, user);

    const currentBalance = user.getPoint();

    return {
      previousBalance,
      currentBalance,
    };
  }
}
