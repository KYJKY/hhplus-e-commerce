import { Injectable } from '@nestjs/common';
import { InventoryDomainService } from '../../domain/services/inventory-domain.service';
import { RestoreStockResponseDto } from '../../presentation/dto';

/**
 * FR-P-007: 재고 복원 Use Case
 *
 * 리팩토링: InventoryDomainService로 변경
 */
@Injectable()
export class RestoreStockUseCase {
  constructor(
    private readonly inventoryDomainService: InventoryDomainService,
  ) {}

  async execute(
    optionId: number,
    quantity: number,
    orderId: number,
  ): Promise<RestoreStockResponseDto> {
    return await this.inventoryDomainService.restoreStock(
      optionId,
      quantity,
      orderId,
    );
  }
}
