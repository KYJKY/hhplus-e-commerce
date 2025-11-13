import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { CheckStockResponseDto } from '../../presentation/dto';

/**
 * FR-P-005: 재고 확인 Use Case
 */
@Injectable()
export class CheckStockUseCase {
  constructor(private readonly productDomainService: ProductDomainService) {}

  async execute(
    optionId: number,
    quantity: number,
  ): Promise<CheckStockResponseDto> {
    return await this.productDomainService.checkStock(optionId, quantity);
  }
}
