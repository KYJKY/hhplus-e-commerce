import { Injectable } from '@nestjs/common';
import { IUserAddressRepository } from '../../domain/repositories/user-address.repository.interface';
import { UserAddress } from '../../domain/entities/user-address.entity';
import { PrismaService } from 'src/common/prisma';

/**
 * Prisma 기반 UserAddress Repository 구현체
 */
@Injectable()
export class PrismaUserAddressRepository implements IUserAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prisma 모델을 Domain Entity로 변환
   */
  private toDomain(data: {
    id: bigint;
    user_id: bigint;
    recipient_name: string;
    recipient_phone: string;
    postal_code: string;
    address_default_text: string;
    address_detail_text: string | null;
    is_default: boolean;
    created_at: Date;
    updated_at: Date;
  }): UserAddress {
    return UserAddress.create({
      id: Number(data.id),
      userId: Number(data.user_id),
      recipientName: data.recipient_name,
      recipientPhone: data.recipient_phone,
      postalCode: data.postal_code,
      addressDefaultText: data.address_default_text,
      addressDetailText: data.address_detail_text,
      isDefault: data.is_default,
      createdAt: data.created_at.toISOString(),
      updatedAt: data.updated_at.toISOString(),
    });
  }

  /**
   * ID로 배송지 조회
   */
  async findById(id: number): Promise<UserAddress | null> {
    const address = await this.prisma.user_address.findUnique({
      where: { id: BigInt(id) },
    });

    return address ? this.toDomain(address) : null;
  }

  /**
   * 사용자 ID로 모든 배송지 조회
   */
  async findByUserId(userId: number): Promise<UserAddress[]> {
    const addresses = await this.prisma.user_address.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    return addresses.map((addr) => this.toDomain(addr));
  }

  /**
   * 사용자의 기본 배송지 조회
   */
  async findDefaultByUserId(userId: number): Promise<UserAddress | null> {
    const address = await this.prisma.user_address.findFirst({
      where: {
        user_id: BigInt(userId),
        is_default: true,
      },
    });

    return address ? this.toDomain(address) : null;
  }

  /**
   * 사용자의 배송지 개수 조회
   */
  async countByUserId(userId: number): Promise<number> {
    return await this.prisma.user_address.count({
      where: { user_id: BigInt(userId) },
    });
  }

  /**
   * 특정 사용자의 특정 배송지 조회 (권한 확인용)
   */
  async findByIdAndUserId(
    addressId: number,
    userId: number,
  ): Promise<UserAddress | null> {
    const address = await this.prisma.user_address.findFirst({
      where: {
        id: BigInt(addressId),
        user_id: BigInt(userId),
      },
    });

    return address ? this.toDomain(address) : null;
  }

  /**
   * 사용자의 기본 배송지를 모두 해제
   */
  async unsetDefaultByUserId(userId: number): Promise<void> {
    await this.prisma.user_address.updateMany({
      where: {
        user_id: BigInt(userId),
        is_default: true,
      },
      data: {
        is_default: false,
        updated_at: new Date(),
      },
    });
  }

  /**
   * 기본 배송지 설정 (트랜잭션)
   */
  async setDefaultAddress(
    userId: number,
    addressId: number,
  ): Promise<UserAddress> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 기존 기본 배송지 해제
      await tx.user_address.updateMany({
        where: {
          user_id: BigInt(userId),
          is_default: true,
        },
        data: {
          is_default: false,
          updated_at: new Date(),
        },
      });

      // 2. 새 기본 배송지 설정
      const updated = await tx.user_address.update({
        where: { id: BigInt(addressId) },
        data: {
          is_default: true,
          updated_at: new Date(),
        },
      });

      return updated;
    });

    return this.toDomain(result);
  }

  /**
   * 조건에 맞는 단일 엔티티 조회
   */
  async findOne(
    predicate: (entity: UserAddress) => boolean,
  ): Promise<UserAddress | null> {
    const addresses = await this.prisma.user_address.findMany();
    const address = addresses.find((a) => predicate(this.toDomain(a)));
    return address ? this.toDomain(address) : null;
  }

  /**
   * 모든 배송지 조회
   */
  async findAll(): Promise<UserAddress[]> {
    const addresses = await this.prisma.user_address.findMany();
    return addresses.map((addr) => this.toDomain(addr));
  }

  /**
   * 조건에 맞는 배송지 목록 조회
   */
  async findMany(
    predicate: (entity: UserAddress) => boolean,
  ): Promise<UserAddress[]> {
    const addresses = await this.prisma.user_address.findMany();
    return addresses
      .filter((a) => predicate(this.toDomain(a)))
      .map((a) => this.toDomain(a));
  }

  /**
   * 배송지 존재 여부 확인
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.user_address.count({
      where: { id: BigInt(id) },
    });
    return count > 0;
  }

  /**
   * 배송지 생성
   */
  async create(address: Omit<UserAddress, 'id'>): Promise<UserAddress> {
    const created = await this.prisma.user_address.create({
      data: {
        user_id: BigInt(address.userId),
        recipient_name: address.recipientName,
        recipient_phone: address.recipientPhone,
        postal_code: address.postalCode,
        address_default_text: address.addressDefaultText,
        address_detail_text: address.addressDetailText,
        is_default: address.isDefault,
        created_at: address.createdAt
          ? new Date(address.createdAt)
          : new Date(),
        updated_at: address.updatedAt
          ? new Date(address.updatedAt)
          : new Date(),
      },
    });

    return this.toDomain(created);
  }

  /**
   * 배송지 수정
   */
  async update(
    id: number,
    updates: Partial<UserAddress>,
  ): Promise<UserAddress | null> {
    const updateData: any = { updated_at: new Date() };

    if (updates.recipientName !== undefined)
      updateData.recipient_name = updates.recipientName;
    if (updates.recipientPhone !== undefined)
      updateData.recipient_phone = updates.recipientPhone;
    if (updates.postalCode !== undefined)
      updateData.postal_code = updates.postalCode;
    if (updates.addressDefaultText !== undefined)
      updateData.address_default_text = updates.addressDefaultText;
    if (updates.addressDetailText !== undefined)
      updateData.address_detail_text = updates.addressDetailText;
    if (updates.isDefault !== undefined)
      updateData.is_default = updates.isDefault;

    const updated = await this.prisma.user_address.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return this.toDomain(updated);
  }

  /**
   * 배송지 삭제
   */
  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.user_address.delete({
        where: { id: BigInt(id) },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 모든 배송지 삭제 (테스트용)
   */
  async clear(): Promise<boolean> {
    try {
      await this.prisma.user_address.deleteMany();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 배송지 개수 조회
   */
  async count(predicate?: (entity: UserAddress) => boolean): Promise<number> {
    if (predicate) {
      const addresses = await this.prisma.user_address.findMany();
      return addresses.filter((a) => predicate(this.toDomain(a))).length;
    }
    return await this.prisma.user_address.count();
  }
}
