import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import {
  GetProductListRequestDto,
  GetProductListResponseDto,
} from '../../presentation/dto';

/**
 * FR-P-001: 상품 목록 조회 Use Case
 */
@Injectable()
export class GetProductListUseCase {
  constructor(private readonly productDomainService: ProductDomainService) {}

  async execute(
    query: GetProductListRequestDto,
  ): Promise<GetProductListResponseDto> {
    return await this.productDomainService.getProductList(query);
  }
}
