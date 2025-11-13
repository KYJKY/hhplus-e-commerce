import { Injectable } from '@nestjs/common';
import { InventoryDomainService } from '../../domain/services/inventory-domain.service';
import { CheckStockResponseDto } from '../../presentation/dto';

/**
 * FR-P-005: 재고 확인 Use Case
 *
 * 리팩토링: InventoryDomainService로 변경
 */
@Injectable()
export class CheckStockUseCase {
  constructor(
    private readonly inventoryDomainService: InventoryDomainService,
  ) {}

  async execute(
    optionId: number,
    quantity: number,
  ): Promise<CheckStockResponseDto> {
    return await this.inventoryDomainService.checkStock(optionId, quantity);
  }
}
