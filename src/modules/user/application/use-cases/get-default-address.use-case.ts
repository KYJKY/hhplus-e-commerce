import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { UserAddressMapper } from '../mappers/user-address.mapper';
import { UserAddressDto } from '../dtos/user-address.dto';

/**
 * FR-U-010: 기본 배송지 조회 Use Case
 */
@Injectable()
export class GetDefaultAddressUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userAddressMapper: UserAddressMapper,
  ) {}

  async execute(userId: number): Promise<UserAddressDto | null> {
    const address = await this.userDomainService.findDefaultAddress(userId);
    return address ? this.userAddressMapper.toDto(address) : null;
  }
}
