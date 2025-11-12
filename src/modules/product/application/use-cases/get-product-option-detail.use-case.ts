import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { GetProductOptionDetailResponseDto } from '../../presentation/dto';

/**
 * FR-P-004: 상품 옵션 상세 조회 Use Case
 */
@Injectable()
export class GetProductOptionDetailUseCase {
  constructor(
    private readonly productDomainService: ProductDomainService,
  ) {}

  async execute(
    productId: number,
    optionId: number,
  ): Promise<GetProductOptionDetailResponseDto> {
    return await this.productDomainService.getProductOptionDetail(
      productId,
      optionId,
    );
  }
}
