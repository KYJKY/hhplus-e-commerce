import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { GetProductDetailResponseDto } from '../../presentation/dto';

/**
 * FR-P-002: 상품 상세 조회 Use Case
 */
@Injectable()
export class GetProductDetailUseCase {
  constructor(private readonly productDomainService: ProductDomainService) {}

  async execute(productId: number): Promise<GetProductDetailResponseDto> {
    return await this.productDomainService.getProductDetail(productId);
  }
}
