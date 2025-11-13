import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { UserAddressMapper } from '../mappers/user-address.mapper';
import { UserAddressDto, CreateAddressDto } from '../dtos/user-address.dto';

/**
 * FR-U-006: 배송지 추가 Use Case
 */
@Injectable()
export class CreateAddressUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userAddressMapper: UserAddressMapper,
  ) {}

  async execute(
    userId: number,
    createData: CreateAddressDto,
  ): Promise<UserAddressDto> {
    const address = await this.userDomainService.createAddress(userId, {
      recipientName: createData.recipientName,
      recipientPhone: createData.recipientPhone,
      postalCode: createData.postalCode,
      addressDefaultText: createData.addressDefaultText,
      addressDetailText: createData.addressDetailText,
      isDefault: createData.isDefault,
    });

    return this.userAddressMapper.toDto(address);
  }
}
