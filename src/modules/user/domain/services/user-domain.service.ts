import { Inject, Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserAddress } from '../entities/user-address.entity';
import type { IUserRepository } from '../repositories/user.repository.interface';
import type { IUserAddressRepository } from '../repositories/user-address.repository.interface';
import {
  UserNotFoundException,
  AddressNotFoundException,
  AddressAccessDeniedException,
  MaxAddressLimitExceededException,
} from '../exceptions';

/**
 * User Domain Service
 *
 * Domain Layer의 비즈니스 로직을 담당
 * - Repository와 직접 상호작용
 * - 도메인 규칙 강제
 * - Use Case에서 호출됨
 */
@Injectable()
export class UserDomainService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IUserAddressRepository')
    private readonly userAddressRepository: IUserAddressRepository,
  ) {}

  /**
   * 사용자 조회 (존재 확인 포함)
   */
  async findUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }

  /**
   * 사용자 프로필 수정
   */
  async updateUserProfile(
    userId: number,
    updateData: {
      name?: string;
      displayName?: string;
      phoneNumber?: string;
    },
  ): Promise<User> {
    const user = await this.findUserById(userId);

    // 도메인 엔티티의 검증 로직 호출
    user.updateProfile(updateData);

    const updatedUser = await this.userRepository.update(userId, user);
    if (!updatedUser) {
      throw new UserNotFoundException(userId);
    }

    return updatedUser;
  }

  /**
   * 사용자의 모든 배송지 조회
   */
  async findAddressesByUserId(userId: number): Promise<UserAddress[]> {
    // 사용자 존재 확인
    await this.findUserById(userId);
    return await this.userAddressRepository.findByUserId(userId);
  }

  /**
   * 배송지 상세 조회 (권한 확인 포함)
   */
  async findAddressWithAuthorization(
    userId: number,
    addressId: number,
  ): Promise<UserAddress> {
    // 사용자 존재 확인
    await this.findUserById(userId);

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
   * 배송지 생성
   */
  async createAddress(
    userId: number,
    addressData: {
      recipientName: string;
      phoneNumber: string;
      zipCode: string;
      address: string;
      detailAddress?: string;
      isDefault?: boolean;
    },
  ): Promise<UserAddress> {
    // 사용자 존재 확인
    await this.findUserById(userId);

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
      phoneNumber: addressData.phoneNumber,
      zipCode: addressData.zipCode,
      address: addressData.address,
      detailAddress: addressData.detailAddress ?? null,
      isDefault: addressData.isDefault ?? false,
      createdAt: new Date().toISOString(),
    });

    // Repository를 통해 생성 (첫 번째 배송지는 자동으로 기본 배송지로 설정)
    return await this.userAddressRepository.create(newAddress);
  }

  /**
   * 배송지 수정 (권한 확인 포함)
   */
  async updateAddress(
    userId: number,
    addressId: number,
    updateData: {
      recipientName?: string;
      phoneNumber?: string;
      zipCode?: string;
      address?: string;
      detailAddress?: string;
    },
  ): Promise<UserAddress> {
    // 배송지 조회 및 권한 확인
    const address = await this.findAddressWithAuthorization(userId, addressId);

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
   * 배송지 삭제 (권한 확인 포함)
   */
  async deleteAddress(userId: number, addressId: number): Promise<void> {
    // 배송지 조회 및 권한 확인
    await this.findAddressWithAuthorization(userId, addressId);

    // Repository를 통해 삭제 (기본 배송지 자동 관리 포함)
    await this.userAddressRepository.delete(addressId);
  }

  /**
   * 기본 배송지 설정 (권한 확인 포함)
   */
  async setDefaultAddress(
    userId: number,
    addressId: number,
  ): Promise<UserAddress> {
    // 배송지 조회 및 권한 확인
    await this.findAddressWithAuthorization(userId, addressId);

    // Repository를 통해 기본 배송지 설정 (기존 기본 배송지 해제 포함)
    return await this.userAddressRepository.setDefaultAddress(
      userId,
      addressId,
    );
  }

  /**
   * 기본 배송지 조회
   */
  async findDefaultAddress(userId: number): Promise<UserAddress | null> {
    // 사용자 존재 확인
    await this.findUserById(userId);

    return await this.userAddressRepository.findDefaultByUserId(userId);
  }

  /**
   * 포인트 충전 (내부 API)
   * PaymentModule에서 사용하기 위한 메서드
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
    const user = await this.findUserById(userId);
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
   * PaymentModule에서 사용하기 위한 메서드
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
    const user = await this.findUserById(userId);
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
