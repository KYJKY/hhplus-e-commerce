import { Injectable } from '@nestjs/common';
import { BaseInMemoryRepository } from 'src/common';
import { UserAddress } from '../../domain/entities/user-address.entity';
import { IUserAddressRepository } from '../../domain/repositories/user-address.repository.interface';

@Injectable()
export class InMemoryUserAddressRepository
  extends BaseInMemoryRepository<UserAddress>
  implements IUserAddressRepository
{
  constructor() {
    super();
    this.initializeData();
  }

  /**
   * 초기 테스트 데이터 로드
   */
  private initializeData(): void {
    const now = new Date().toISOString();

    // 사용자 1 (홍길동)의 배송지 3개
    const address1 = UserAddress.create({
      id: 1,
      userId: 1,
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      postalCode: '06234',
      addressDefaultText: '서울시 강남구 테헤란로 123',
      addressDetailText: '456호',
      isDefault: true,
      createdAt: now,
      updatedAt: null,
    });

    const address2 = UserAddress.create({
      id: 2,
      userId: 1,
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      postalCode: '06235',
      addressDefaultText: '서울시 강남구 역삼동 789',
      addressDetailText: '101동 202호',
      isDefault: false,
      createdAt: now,
      updatedAt: null,
    });

    const address3 = UserAddress.create({
      id: 3,
      userId: 1,
      recipientName: '홍부인',
      recipientPhone: '010-9876-5432',
      postalCode: '13579',
      addressDefaultText: '경기도 성남시 분당구 판교역로 100',
      addressDetailText: '판교 타워 10층',
      isDefault: false,
      createdAt: now,
      updatedAt: null,
    });

    // 사용자 2 (김철수)의 배송지 1개
    const address4 = UserAddress.create({
      id: 4,
      userId: 2,
      recipientName: '김철수',
      recipientPhone: '010-2345-6789',
      postalCode: '04567',
      addressDefaultText: '서울시 중구 명동길 50',
      addressDetailText: '3층',
      isDefault: true,
      createdAt: now,
      updatedAt: null,
    });

    // 사용자 3 (이영희)의 배송지 2개
    const address5 = UserAddress.create({
      id: 5,
      userId: 3,
      recipientName: '이영희',
      recipientPhone: '010-3456-7890',
      postalCode: '05678',
      addressDefaultText: '서울시 마포구 상암동 123',
      addressDetailText: null,
      isDefault: false,
      createdAt: now,
      updatedAt: null,
    });

    const address6 = UserAddress.create({
      id: 6,
      userId: 3,
      recipientName: '이영희',
      recipientPhone: '010-3456-7890',
      postalCode: '12345',
      addressDefaultText: '부산시 해운대구 우동 456',
      addressDetailText: '702호',
      isDefault: true,
      createdAt: now,
      updatedAt: null,
    });

    this.entities.set(1, address1);
    this.entities.set(2, address2);
    this.entities.set(3, address3);
    this.entities.set(4, address4);
    this.entities.set(5, address5);
    this.entities.set(6, address6);

    // currentId를 마지막 ID 다음으로 설정
    this.currentId = 7;
  }
  /**
   * Plain object를 UserAddress 엔티티로 변환
   */
  private toEntity(data: UserAddress): UserAddress {
    return UserAddress.create({
      id: data.id,
      userId: data.userId,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      postalCode: data.postalCode,
      addressDefaultText: data.addressDefaultText,
      addressDetailText: data.addressDetailText,
      isDefault: data.isDefault,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 단일 엔티티 조회 오버라이드
   */
  override async findById(id: number): Promise<UserAddress | null> {
    const entity = await super.findById(id);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 조건에 맞는 단일 엔티티 조회 오버라이드
   */
  override async findOne(
    predicate: (entity: UserAddress) => boolean,
  ): Promise<UserAddress | null> {
    const entity = await super.findOne(predicate);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 모든 엔티티 조회 오버라이드
   */
  override async findAll(): Promise<UserAddress[]> {
    const entities = await super.findAll();
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 조건에 맞는 엔티티 목록 조회 오버라이드
   */
  override async findMany(
    predicate: (entity: UserAddress) => boolean,
  ): Promise<UserAddress[]> {
    const entities = await super.findMany(predicate);
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 엔티티 수정 오버라이드
   */
  override async update(
    id: number,
    entityData: Partial<UserAddress>,
  ): Promise<UserAddress | null> {
    const entity = await super.update(id, entityData);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 사용자 ID로 모든 배송지 조회
   */
  async findByUserId(userId: number): Promise<UserAddress[]> {
    return this.findMany((address) => address.userId === userId);
  }

  /**
   * 사용자의 기본 배송지 조회
   */
  async findDefaultByUserId(userId: number): Promise<UserAddress | null> {
    const defaultAddress = await this.findOne(
      (address) => address.userId === userId && address.isDefault === true,
    );
    return this.delay(defaultAddress);
  }

  /**
   * 사용자의 배송지 개수 조회
   */
  async countByUserId(userId: number): Promise<number> {
    const count = await this.count((address) => address.userId === userId);
    return this.delay(count);
  }

  /**
   * 특정 사용자의 특정 배송지 조회 (권한 확인용)
   */
  async findByIdAndUserId(
    addressId: number,
    userId: number,
  ): Promise<UserAddress | null> {
    return this.findOne(
      (addr) => addr.id === addressId && addr.userId === userId,
    );
  }

  /**
   * 사용자의 기본 배송지를 모두 해제
   */
  async unsetDefaultByUserId(userId: number): Promise<void> {
    const addresses = Array.from(this.entities.values()).filter(
      (address) => address.userId === userId && address.isDefault === true,
    );

    for (const plainAddress of addresses) {
      const address = this.toEntity(plainAddress);
      address.unsetAsDefault();
      this.entities.set(address.id, address);
    }

    await this.delay(undefined);
  }

  /**
   * 기본 배송지 설정 (기존 기본 배송지 해제 포함)
   * 원자성 보장을 위해 withLock 사용
   */
  async setDefaultAddress(
    userId: number,
    addressId: number,
  ): Promise<UserAddress> {
    return await this.withLock(userId, async () => {
      // 1. 기존 기본 배송지 해제
      await this.unsetDefaultByUserId(userId);

      // 2. 새로운 기본 배송지 설정
      const plainAddress = this.entities.get(addressId);
      if (!plainAddress) {
        throw new Error('Address not found');
      }

      const address = this.toEntity(plainAddress);
      address.setAsDefault();
      this.entities.set(addressId, address);

      return address;
    });
  }

  /**
   * 배송지 생성 (오버라이드)
   * 첫 번째 배송지는 자동으로 기본 배송지로 설정
   */
  override async create(
    entityData: Omit<UserAddress, 'id'>,
  ): Promise<UserAddress> {
    const userId = entityData.userId;
    const addressCount = await this.countByUserId(userId);

    // 첫 번째 배송지인 경우 자동으로 기본 배송지로 설정
    const isFirstAddress = addressCount === 0;
    const shouldBeDefault = isFirstAddress || entityData.isDefault;

    if (shouldBeDefault) {
      // 기존 기본 배송지 해제
      await this.unsetDefaultByUserId(userId);
    }

    const id = this.getNextId();
    const entity = {
      ...entityData,
      id,
      isDefault: shouldBeDefault,
    } as UserAddress;
    this.entities.set(id, entity);

    const result = JSON.parse(JSON.stringify(entity)) as UserAddress;
    return await this.delay(result);
  }

  /**
   * 배송지 삭제 (오버라이드)
   * 기본 배송지 삭제 시 가장 최근 배송지를 기본 배송지로 설정
   */
  override async delete(addressId: number): Promise<boolean> {
    const plainAddress = this.entities.get(addressId);
    if (!plainAddress) {
      return await this.delay(false);
    }

    const address = this.toEntity(plainAddress);
    const wasDefault = address.isDefault;
    const userId = address.userId;

    // 배송지 삭제
    const deleted = this.entities.delete(addressId);

    // 기본 배송지가 삭제된 경우, 남은 배송지 중 가장 최근 배송지를 기본으로 설정
    if (wasDefault && deleted) {
      const remainingPlainAddresses = Array.from(this.entities.values())
        .filter((addr) => addr.userId === userId)
        .sort((a, b) => {
          // createdAt 기준 내림차순 정렬 (가장 최근 것이 먼저)
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

      if (remainingPlainAddresses.length > 0) {
        const mostRecentAddress = this.toEntity(remainingPlainAddresses[0]);
        mostRecentAddress.setAsDefault();
        this.entities.set(mostRecentAddress.id, mostRecentAddress);
      }
    }

    return await this.delay(deleted);
  }
}
