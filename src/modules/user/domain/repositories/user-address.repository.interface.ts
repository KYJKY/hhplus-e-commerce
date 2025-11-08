import { IRepository } from 'src/common';
import { UserAddress } from '../entities/user-address.entity';

/**
 * UserAddress 도메인 Repository 인터페이스
 */
export interface IUserAddressRepository extends IRepository<UserAddress> {
  /**
   * 사용자 ID로 모든 배송지 조회
   */
  findByUserId(userId: number): Promise<UserAddress[]>;

  /**
   * 사용자의 기본 배송지 조회
   */
  findDefaultByUserId(userId: number): Promise<UserAddress | null>;

  /**
   * 사용자의 배송지 개수 조회
   */
  countByUserId(userId: number): Promise<number>;

  /**
   * 특정 사용자의 특정 배송지 조회 (권한 확인용)
   */
  findByIdAndUserId(
    addressId: number,
    userId: number,
  ): Promise<UserAddress | null>;

  /**
   * 사용자의 기본 배송지를 모두 해제
   */
  unsetDefaultByUserId(userId: number): Promise<void>;

  /**
   * 기본 배송지 설정 (기존 기본 배송지 해제 포함)
   * @param userId - 사용자 ID
   * @param addressId - 기본으로 설정할 배송지 ID
   */
  setDefaultAddress(userId: number, addressId: number): Promise<UserAddress>;
}
