import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { BaseInMemoryRepository } from 'src/common';

@Injectable()
export class InMemoryCategoryRepository
  extends BaseInMemoryRepository<Category>
  implements ICategoryRepository
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

    // 테스트 카테고리 1
    const category1 = Category.create({
      id: 1,
      categoryName: '상의',
      displayOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: null,
    });

    // 테스트 카테고리 2
    const category2 = Category.create({
      id: 2,
      categoryName: '하의',
      displayOrder: 2,
      isActive: true,
      createdAt: now,
      updatedAt: null,
    });

    // 테스트 카테고리 3
    const category3 = Category.create({
      id: 3,
      categoryName: '아우터',
      displayOrder: 3,
      isActive: true,
      createdAt: now,
      updatedAt: null,
    });

    // 테스트 카테고리 4 (비활성화)
    const category4 = Category.create({
      id: 4,
      categoryName: '신발',
      displayOrder: 4,
      isActive: false,
      createdAt: now,
      updatedAt: null,
    });

    this.entities.set(1, category1);
    this.entities.set(2, category2);
    this.entities.set(3, category3);
    this.entities.set(4, category4);

    // currentId를 마지막 ID 다음으로 설정
    this.currentId = 5;
  }

  /**
   * Plain object를 Category 엔티티로 변환
   */
  private toEntity(data: Category): Category {
    return Category.create({
      id: data.id,
      categoryName: data.categoryName,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * 단일 엔티티 조회 오버라이드
   */
  override async findById(id: number): Promise<Category | null> {
    const entity = await super.findById(id);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 조건에 맞는 단일 엔티티 조회 오버라이드
   */
  override async findOne(
    predicate: (entity: Category) => boolean,
  ): Promise<Category | null> {
    const entity = await super.findOne(predicate);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 모든 엔티티 조회 오버라이드
   */
  override async findAll(): Promise<Category[]> {
    const entities = await super.findAll();
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 조건에 맞는 엔티티 목록 조회 오버라이드
   */
  override async findMany(
    predicate: (entity: Category) => boolean,
  ): Promise<Category[]> {
    const entities = await super.findMany(predicate);
    return entities.map((entity) => this.toEntity(entity));
  }

  /**
   * 엔티티 수정 오버라이드
   */
  override async update(
    id: number,
    entityData: Partial<Category>,
  ): Promise<Category | null> {
    const entity = await super.update(id, entityData);
    return entity ? this.toEntity(entity) : null;
  }

  /**
   * 활성화된 카테고리 목록 조회 (displayOrder 오름차순)
   */
  async findActiveCategories(): Promise<Category[]> {
    const activeCategories = await this.findMany(
      (category) => category.isActive,
    );
    return activeCategories.sort((a, b) => a.displayOrder - b.displayOrder);
  }
}
