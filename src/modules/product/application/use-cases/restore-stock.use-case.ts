import { Injectable } from '@nestjs/common';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { RestoreStockResponseDto } from '../../presentation/dto';

/**
 * FR-P-007: 재고 복원 Use Case
 */
@Injectable()
export class RestoreStockUseCase {
  constructor(private readonly productDomainService: ProductDomainService) {}

  async execute(
    optionId: number,
    quantity: number,
    orderId: number,
  ): Promise<RestoreStockResponseDto> {
    return await this.productDomainService.restoreStock(
      optionId,
      quantity,
      orderId,
    );
  }
}
