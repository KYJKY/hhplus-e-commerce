import { Injectable } from '@nestjs/common';
import { ProductQueryService } from '../../domain/services/product-query.service';
import { GetPopularProductsResponseDto } from '../../presentation/dto';

/**
 * FR-P-008: 인기 상품 조회 Use Case
 *
 * 리팩토링: ProductQueryService로 변경
 */
@Injectable()
export class GetPopularProductsUseCase {
  constructor(private readonly productQueryService: ProductQueryService) {}

  async execute(): Promise<GetPopularProductsResponseDto> {
    return await this.productQueryService.getPopularProducts();
  }
}
