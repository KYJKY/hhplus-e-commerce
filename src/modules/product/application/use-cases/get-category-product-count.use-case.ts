import { Injectable } from '@nestjs/common';
import { CategoryQueryService } from '../../domain/services/category-query.service';
import { GetCategoryProductCountResponseDto } from '../../presentation/dto';

/**
 * FR-P-010: 카테고리별 상품 수 조회 Use Case
 *
 * 리팩토링: CategoryQueryService로 변경
 */
@Injectable()
export class GetCategoryProductCountUseCase {
  constructor(private readonly categoryQueryService: CategoryQueryService) {}

  async execute(
    categoryId: number,
  ): Promise<GetCategoryProductCountResponseDto> {
    return await this.categoryQueryService.getCategoryProductCount(categoryId);
  }
}
