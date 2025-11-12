import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { UserAddressMapper } from '../mappers/user-address.mapper';
import { UserAddressDto } from '../dtos/user-address.dto';

/**
 * FR-U-009: 기본 배송지 설정 Use Case
 */
@Injectable()
export class SetDefaultAddressUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userAddressMapper: UserAddressMapper,
  ) {}

  async execute(userId: number, addressId: number): Promise<UserAddressDto> {
    const address = await this.userDomainService.setDefaultAddress(
      userId,
      addressId,
    );
    return this.userAddressMapper.toDto(address);
  }
}
