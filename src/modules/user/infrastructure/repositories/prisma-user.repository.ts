import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { PrismaService } from 'src/common/prisma';

/**
 * Prisma 기반 User Repository 구현체
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prisma 모델을 Domain Entity로 변환
   */
  private toDomain(data: {
    id: bigint;
    login_id: string;
    login_password: string;
    email: string;
    name: string;
    display_name: string | null;
    phone_number: string | null;
    point: any; // Decimal
    last_login_at: Date | null;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): User {
    return User.create({
      id: Number(data.id),
      loginId: data.login_id,
      loginPassword: data.login_password,
      email: data.email,
      name: data.name,
      displayName: data.display_name,
      phoneNumber: data.phone_number,
      point: Number(data.point),
      lastLoginAt: data.last_login_at?.toISOString() ?? null,
      deletedAt: data.deleted_at?.toISOString() ?? null,
      createdAt: data.created_at.toISOString(),
      updatedAt: data.updated_at.toISOString(),
    });
  }

  /**
   * ID로 사용자 조회
   */
  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(id) },
    });

    return user ? this.toDomain(user) : null;
  }

  /**
   * 로그인 ID로 사용자 조회
   */
  async findByLoginId(loginId: string): Promise<User | null> {
    const user = await this.prisma.users.findUnique({
      where: { login_id: loginId },
    });

    return user ? this.toDomain(user) : null;
  }

  /**
   * 이메일로 사용자 조회
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    return user ? this.toDomain(user) : null;
  }

  /**
   * 조건에 맞는 단일 엔티티 조회
   */
  async findOne(predicate: (entity: User) => boolean): Promise<User | null> {
    const users = await this.prisma.users.findMany();
    const user = users.find((u) => predicate(this.toDomain(u)));
    return user ? this.toDomain(user) : null;
  }

  /**
   * 모든 사용자 조회
   */
  async findAll(): Promise<User[]> {
    const users = await this.prisma.users.findMany();
    return users.map((user) => this.toDomain(user));
  }

  /**
   * 조건에 맞는 사용자 목록 조회
   */
  async findMany(predicate: (entity: User) => boolean): Promise<User[]> {
    const users = await this.prisma.users.findMany();
    return users
      .filter((u) => predicate(this.toDomain(u)))
      .map((u) => this.toDomain(u));
  }

  /**
   * 사용자 존재 여부 확인
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.users.count({
      where: { id: BigInt(id) },
    });
    return count > 0;
  }

  /**
   * 사용자 생성
   */
  async create(user: Omit<User, 'id'>): Promise<User> {
    const created = await this.prisma.users.create({
      data: {
        login_id: user.loginId,
        login_password: '', // Password는 User 엔티티에서 직접 접근 불가
        email: user.email,
        name: user.name,
        display_name: user.displayName,
        phone_number: user.phoneNumber,
        point: user.getPoint(),
        last_login_at: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
        deleted_at: user.deletedAt ? new Date(user.deletedAt) : null,
        created_at: user.createdAt ? new Date(user.createdAt) : new Date(),
        updated_at: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      },
    });

    return this.toDomain(created);
  }

  /**
   * 사용자 수정
   */
  async update(id: number, updates: Partial<User>): Promise<User | null> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.displayName !== undefined)
      updateData.display_name = updates.displayName;
    if (updates.phoneNumber !== undefined)
      updateData.phone_number = updates.phoneNumber;
    if (updates.lastLoginAt !== undefined) {
      updateData.last_login_at = updates.lastLoginAt
        ? new Date(updates.lastLoginAt)
        : null;
    }
    if (updates.deletedAt !== undefined) {
      updateData.deleted_at = updates.deletedAt
        ? new Date(updates.deletedAt)
        : null;
    }

    updateData.updated_at = new Date();

    const updated = await this.prisma.users.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return this.toDomain(updated);
  }

  /**
   * 사용자 삭제
   */
  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.users.delete({
        where: { id: BigInt(id) },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 모든 사용자 삭제 (테스트용)
   */
  async clear(): Promise<boolean> {
    try {
      await this.prisma.users.deleteMany();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 사용자 개수 조회
   */
  async count(predicate?: (entity: User) => boolean): Promise<number> {
    if (predicate) {
      const users = await this.prisma.users.findMany();
      return users.filter((u) => predicate(this.toDomain(u))).length;
    }
    return await this.prisma.users.count();
  }
}
