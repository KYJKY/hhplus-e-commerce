import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { DeductStockResponseDto } from '../../presentation/dto';

/**
 * FR-P-006: 재고 차감 Use Case
 */
@Injectable()
export class DeductStockUseCase {
  constructor(
    private readonly productDomainService: ProductDomainService,
  ) {}

  async execute(
    optionId: number,
    quantity: number,
    orderId: number,
  ): Promise<DeductStockResponseDto> {
    return await this.productDomainService.deductStock(
      optionId,
      quantity,
      orderId,
    );
  }
}
