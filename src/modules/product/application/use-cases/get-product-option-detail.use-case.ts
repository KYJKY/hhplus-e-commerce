import { Injectable } from '@nestjs/common';
import { ProductQueryService } from '../../domain/services/product-query.service';
import { GetProductOptionDetailResponseDto } from '../../presentation/dto';

/**
 * FR-P-004: 상품 옵션 상세 조회 Use Case
 *
 * 리팩토링: ProductQueryService로 변경
 */
@Injectable()
export class GetProductOptionDetailUseCase {
  constructor(private readonly productQueryService: ProductQueryService) {}

  async execute(
    productId: number,
    optionId: number,
  ): Promise<GetProductOptionDetailResponseDto> {
    return await this.productQueryService.getProductOptionDetail(
      productId,
      optionId,
    );
  }
}
