import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { GetCategoryProductCountResponseDto } from '../../presentation/dto';

/**
 * FR-P-010: 카테고리별 상품 수 조회 Use Case
 */
@Injectable()
export class GetCategoryProductCountUseCase {
  constructor(
    private readonly productDomainService: ProductDomainService,
  ) {}

  async execute(
    categoryId: number,
  ): Promise<GetCategoryProductCountResponseDto> {
    return await this.productDomainService.getCategoryProductCount(categoryId);
  }
}
