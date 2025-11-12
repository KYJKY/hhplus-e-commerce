import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { GetCategoriesResponseDto } from '../../presentation/dto';

/**
 * FR-P-009: 카테고리 목록 조회 Use Case
 */
@Injectable()
export class GetCategoriesUseCase {
  constructor(
    private readonly productDomainService: ProductDomainService,
  ) {}

  async execute(): Promise<GetCategoriesResponseDto> {
    const categories = await this.productDomainService.getCategories();
    return { categories };
  }
}
