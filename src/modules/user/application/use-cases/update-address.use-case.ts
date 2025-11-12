import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { UserAddressMapper } from '../mappers/user-address.mapper';
import { UserAddressDto, UpdateAddressDto } from '../dtos/user-address.dto';

/**
 * FR-U-007: 배송지 수정 Use Case
 */
@Injectable()
export class UpdateAddressUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userAddressMapper: UserAddressMapper,
  ) {}

  async execute(
    userId: number,
    addressId: number,
    updateData: UpdateAddressDto,
  ): Promise<UserAddressDto> {
    const address = await this.userDomainService.updateAddress(
      userId,
      addressId,
      {
        recipientName: updateData.recipientName,
        phoneNumber: updateData.phoneNumber,
        zipCode: updateData.zipCode,
        address: updateData.address,
        detailAddress: updateData.detailAddress,
      },
    );

    return this.userAddressMapper.toDto(address);
  }
}
