/**
 * 기본 엔티티 인터페이스
 * 모든 엔티티는 id를 가져야 함
 */
export interface BaseEntity {
  id: number;
}

/**
 * Repository 기본 인터페이스
 * CRUD 기본 작업 정의
 */
export interface IRepository<T extends BaseEntity> {
  /**
   * 단일 엔티티 조회 (ID)
   */
  findById(id: number): Promise<T | null>;

  /**
   * 조건에 맞는 단일 엔티티 조회
   */
  findOne(predicate: (entity: T) => boolean): Promise<T | null>;

  /**
   * 모든 엔티티 조회
   */
  findAll(): Promise<T[]>;

  /**
   * 조건에 맞는 엔티티 목록 조회
   */
  findMany(predicate: (entity: T) => boolean): Promise<T[]>;

  /**
   * 엔티티 존재 여부 확인
   */
  exists(id: number): Promise<boolean>;

  /**
   * 엔티티 생성
   */
  create(entity: Omit<T, 'id'>): Promise<T>;

  /**
   * 엔티티 수정
   */
  update(id: number, entity: Partial<T>): Promise<T | null>;

  /**
   * 엔티티 삭제
   */
  delete(id: number): Promise<boolean>;

  /**
   * 모든 엔티티 삭제 (테스트용)
   */
  clear(): Promise<boolean>;

  /**
   * 엔티티 개수 조회
   */
  count(predicate?: (entity: T) => boolean): Promise<number>;
}
