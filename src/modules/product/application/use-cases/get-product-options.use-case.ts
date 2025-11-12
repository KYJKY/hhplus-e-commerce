import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { GetProductOptionsResponseDto } from '../../presentation/dto';

/**
 * FR-P-003: 상품 옵션 조회 Use Case
 */
@Injectable()
export class GetProductOptionsUseCase {
  constructor(
    private readonly productDomainService: ProductDomainService,
  ) {}

  async execute(productId: number): Promise<GetProductOptionsResponseDto> {
    return await this.productDomainService.getProductOptions(productId);
  }
}
