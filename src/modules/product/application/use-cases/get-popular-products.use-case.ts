import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { GetPopularProductsResponseDto } from '../../presentation/dto';

/**
 * FR-P-008: 인기 상품 조회 Use Case
 */
@Injectable()
export class GetPopularProductsUseCase {
  constructor(
    private readonly productDomainService: ProductDomainService,
  ) {}

  async execute(): Promise<GetPopularProductsResponseDto> {
    return await this.productDomainService.getPopularProducts();
  }
}
