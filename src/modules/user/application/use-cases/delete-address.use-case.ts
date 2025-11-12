import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';

/**
 * FR-U-008: 배송지 삭제 Use Case
 */
@Injectable()
export class DeleteAddressUseCase {
  constructor(private readonly userDomainService: UserDomainService) {}

  async execute(userId: number, addressId: number): Promise<void> {
    await this.userDomainService.deleteAddress(userId, addressId);
  }
}
