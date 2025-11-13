import { Injectable } from '@nestjs/common';
import { ProductQueryService } from '../../domain/services/product-query.service';
import { GetProductDetailResponseDto } from '../../presentation/dto';

/**
 * FR-P-002: 상품 상세 조회 Use Case
 *
 * 리팩토링: ProductQueryService로 변경
 */
@Injectable()
export class GetProductDetailUseCase {
  constructor(private readonly productQueryService: ProductQueryService) {}

  async execute(productId: number): Promise<GetProductDetailResponseDto> {
    return await this.productQueryService.getProductDetail(productId);
  }
}
