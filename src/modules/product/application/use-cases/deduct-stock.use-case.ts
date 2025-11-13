import { Injectable } from '@nestjs/common';
import { InventoryDomainService } from '../../domain/services/inventory-domain.service';
import { DeductStockResponseDto } from '../../presentation/dto';

/**
 * FR-P-006: 재고 차감 Use Case
 *
 * 리팩토링: InventoryDomainService로 변경
 */
@Injectable()
export class DeductStockUseCase {
  constructor(
    private readonly inventoryDomainService: InventoryDomainService,
  ) {}

  async execute(
    optionId: number,
    quantity: number,
    orderId: number,
  ): Promise<DeductStockResponseDto> {
    return await this.inventoryDomainService.deductStock(
      optionId,
      quantity,
      orderId,
    );
  }
}
