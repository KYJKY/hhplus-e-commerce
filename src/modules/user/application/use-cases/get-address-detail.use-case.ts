import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { UserAddressMapper } from '../mappers/user-address.mapper';
import { UserAddressDto } from '../dtos/user-address.dto';

/**
 * FR-U-005: 배송지 상세 조회 Use Case
 */
@Injectable()
export class GetAddressDetailUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userAddressMapper: UserAddressMapper,
  ) {}

  async execute(userId: number, addressId: number): Promise<UserAddressDto> {
    const address = await this.userDomainService.findAddressWithAuthorization(
      userId,
      addressId,
    );
    return this.userAddressMapper.toDto(address);
  }
}
