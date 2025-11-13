import { randomInt } from 'crypto';
import type { BaseEntity, IRepository } from './repository.interface';

/**
 * In-Memory Repository 기본 구현
 * 모든 도메인 In-Memory Repository가 상속받을 추상 클래스
 */
export abstract class BaseInMemoryRepository<T extends BaseEntity>
  implements IRepository<T>
{
  protected entities: Map<number, T> = new Map();
  protected currentId = 1;
  private readonly locks: Map<number, Promise<void>> = new Map();

  protected delay<T>(data: T): Promise<T> {
    return new Promise((r) =>
      setTimeout(() => {
        r(data);
      }, randomInt(200)),
    );
  }

  /**
   * 다음 ID 생성
   */
  protected getNextId(): number {
    return this.currentId++;
  }

  /**
   * 단일 엔티티 조회 (ID)
   */
  async findById(id: number): Promise<T | null> {
    const entity = this.entities.get(id);
    const result = entity ? this.clone(entity) : null;
    return await this.delay(result);
  }

  /**
   * 조건에 맞는 단일 엔티티 조회
   */
  async findOne(predicate: (entity: T) => boolean): Promise<T | null> {
    let result: T | null = null;
    for (const entity of this.entities.values()) {
      if (predicate(entity)) {
        result = this.clone(entity);
        break;
      }
    }
    return await this.delay(result);
  }

  /**
   * 모든 엔티티 조회
   */
  async findAll(): Promise<T[]> {
    const result = Array.from(this.entities.values()).map((entity) =>
      this.clone(entity),
    );
    return await this.delay(result);
  }

  /**
   * 조건에 맞는 엔티티 목록 조회
   */
  async findMany(predicate: (entity: T) => boolean): Promise<T[]> {
    const result = Array.from(this.entities.values())
      .filter(predicate)
      .map((entity) => this.clone(entity));
    return await this.delay(result);
  }

  /**
   * 엔티티 존재 여부 확인
   */
  async exists(id: number): Promise<boolean> {
    const result = this.entities.has(id);
    return await this.delay(result);
  }

  /**
   * 엔티티 생성
   */
  async create(entityData: Omit<T, 'id'>): Promise<T> {
    const id = this.getNextId();
    const entity = { ...entityData, id } as T;
    this.entities.set(id, entity);
    const result = this.clone(entity);
    return await this.delay(result);
  }

  /**
   * 엔티티 수정
   */
  async update(id: number, entityData: Partial<T>): Promise<T | null> {
    const existingEntity = this.entities.get(id);
    if (!existingEntity) {
      return await this.delay(null);
    }

    const updatedEntity = { ...existingEntity, ...entityData };
    this.entities.set(id, updatedEntity);
    const result = this.clone(updatedEntity);
    return await this.delay(result);
  }

  /**
   * 엔티티 삭제
   */
  async delete(id: number): Promise<boolean> {
    const result = this.entities.delete(id);
    return await this.delay(result);
  }

  /**
   * 모든 엔티티 삭제 (테스트용)
   */
  async clear(): Promise<boolean> {
    this.entities.clear();
    this.currentId = 1;
    this.locks.clear();

    return await this.delay(true);
  }

  /**
   * 엔티티 개수 조회
   */
  async count(predicate?: (entity: T) => boolean): Promise<number> {
    let result: number;

    if (!predicate) {
      result = this.entities.size;
    } else {
      let count = 0;
      for (const entity of this.entities.values()) {
        if (predicate(entity)) {
          count++;
        }
      }
      result = count;
    }

    return await this.delay(result);
  }

  /**
   * 원자성 보장을 위한 락 메커니즘
   * 동시성 제어가 필요한 작업에 사용
   */
  protected async withLock<R>(
    key: number,
    operation: () => Promise<R>,
  ): Promise<R> {
    // 기존 락이 있으면 대기
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // 새로운 락 생성
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(key, lockPromise);

    try {
      // 작업 실행
      return await operation();
    } finally {
      // 락 해제
      this.locks.delete(key);
      releaseLock!();
    }
  }

  /**
   * 엔티티 복제 (불변성 보장)
   */
  private clone(entity: T): T {
    return JSON.parse(JSON.stringify(entity)) as T;
  }
}
