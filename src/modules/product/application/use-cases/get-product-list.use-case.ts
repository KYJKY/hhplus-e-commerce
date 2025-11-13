import { Injectable } from '@nestjs/common';
import { ProductQueryService } from '../../domain/services/product-query.service';
import {
  GetProductListRequestDto,
  GetProductListResponseDto,
} from '../../presentation/dto';

/**
 * FR-P-001: 상품 목록 조회 Use Case
 *
 * 리팩토링: ProductQueryService로 변경
 */
@Injectable()
export class GetProductListUseCase {
  constructor(private readonly productQueryService: ProductQueryService) {}

  async execute(
    query: GetProductListRequestDto,
  ): Promise<GetProductListResponseDto> {
    return await this.productQueryService.getProductList(query);
  }
}
