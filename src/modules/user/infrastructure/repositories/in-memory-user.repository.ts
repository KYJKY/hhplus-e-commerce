import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { BaseInMemoryRepository } from 'src/common';

@Injectable()
export class InMemoryUserRepository
  extends BaseInMemoryRepository<User>
  implements IUserRepository
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

    // 테스트 사용자 1
    const user1 = User.create({
      id: 1,
      loginId: 'user1',
      loginPassword: 'hashed_password_1',
      email: 'user1@example.com',
      name: '홍길동',
      displayName: '길동이',
      phoneNumber: '010-1234-5678',
      lastLoginAt: now,
      deletedAt: null,
      createdAt: now,
      updatedAt: null,
    });

    // 테스트 사용자 2
    const user2 = User.create({
      id: 2,
      loginId: 'user2',
      loginPassword: 'hashed_password_2',
      email: 'user2@example.com',
      name: '김철수',
      displayName: '철수',
      phoneNumber: '010-2345-6789',
      lastLoginAt: now,
      deletedAt: null,
      createdAt: now,
      updatedAt: null,
    });

    // 테스트 사용자 3
    const user3 = User.create({
      id: 3,
      loginId: 'user3',
      loginPassword: 'hashed_password_3',
      email: 'user3@example.com',
      name: '이영희',
      displayName: '영희',
      phoneNumber: '010-3456-7890',
      lastLoginAt: now,
      deletedAt: null,
      createdAt: now,
      updatedAt: null,
    });

    this.entities.set(1, user1);
    this.entities.set(2, user2);
    this.entities.set(3, user3);

    // currentId를 마지막 ID 다음으로 설정
    (this as any).currentId = 4;
  }

  /**
   * Plain object를 User 엔티티로 변환
   */
  private toEntity(data: any): User {
    return User.create({
      id: data.id,
      loginId: data.loginId,
      loginPassword: data.loginPassword,
      email: data.email,
      name: data.name,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
      lastLoginAt: data.lastLoginAt,
      deletedAt: data.deletedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 단일 엔티티 조회 오버라이드
   */
  override async findById(id: number): Promise<User | null> {
    const entity = await super.findById(id);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 조건에 맞는 단일 엔티티 조회 오버라이드
   */
  override async findOne(
    predicate: (entity: User) => boolean,
  ): Promise<User | null> {
    const entity = await super.findOne(predicate);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 모든 엔티티 조회 오버라이드
   */
  override async findAll(): Promise<User[]> {
    const entities = await super.findAll();
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 조건에 맞는 엔티티 목록 조회 오버라이드
   */
  override async findMany(
    predicate: (entity: User) => boolean,
  ): Promise<User[]> {
    const entities = await super.findMany(predicate);
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 엔티티 수정 오버라이드
   */
  override async update(
    id: number,
    entityData: Partial<User>,
  ): Promise<User | null> {
    const entity = await super.update(id, entityData);
    return entity ? this.toEntity(entity) : null;
  }

  async findByLoginId(loginId: string): Promise<User | null> {
    return this.findOne((user) => user.loginId === loginId);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne((user) => user.email === email);
  }
}
