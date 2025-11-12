import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { UserAddressMapper } from '../mappers/user-address.mapper';
import { UserAddressDto } from '../dtos/user-address.dto';

/**
 * FR-U-004: 배송지 목록 조회 Use Case
 */
@Injectable()
export class GetAddressListUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userAddressMapper: UserAddressMapper,
  ) {}

  async execute(userId: number): Promise<UserAddressDto[]> {
    const addresses =
      await this.userDomainService.findAddressesByUserId(userId);
    return this.userAddressMapper.toDtoArray(addresses);
  }
}
