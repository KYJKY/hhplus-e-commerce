import { Injectable } from '@nestjs/common';
import { ProductQueryService } from '../../domain/services/product-query.service';
import { GetProductOptionsResponseDto } from '../../presentation/dto';

/**
 * FR-P-003: 상품 옵션 조회 Use Case
 *
 * 리팩토링: ProductQueryService로 변경
 */
@Injectable()
export class GetProductOptionsUseCase {
  constructor(private readonly productQueryService: ProductQueryService) {}

  async execute(productId: number): Promise<GetProductOptionsResponseDto> {
    return await this.productQueryService.getProductOptions(productId);
  }
}
