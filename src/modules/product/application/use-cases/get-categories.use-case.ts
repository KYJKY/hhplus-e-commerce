import { Injectable } from '@nestjs/common';
import { CategoryQueryService } from '../../domain/services/category-query.service';
import { GetCategoriesResponseDto } from '../../presentation/dto';

/**
 * FR-P-009: 카테고리 목록 조회 Use Case
 *
 * 리팩토링: CategoryQueryService로 변경
 */
@Injectable()
export class GetCategoriesUseCase {
  constructor(private readonly categoryQueryService: CategoryQueryService) {}

  async execute(): Promise<GetCategoriesResponseDto> {
    const categories = await this.categoryQueryService.getCategories();
    return { categories };
  }
}
