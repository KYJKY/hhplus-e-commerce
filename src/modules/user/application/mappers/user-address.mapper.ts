import { Injectable } from '@nestjs/common';
import { UserAddress } from '../../domain/entities/user-address.entity';
import { UserAddressDto } from '../dtos/user-address.dto';

/**
 * UserAddress Mapper
 *
 * Domain Entity ↔ Application DTO 변환
 * Presentation Layer와 Domain Layer를 격리
 */
@Injectable()
export class UserAddressMapper {
  /**
   * UserAddress Entity → UserAddressDto
   */
  toDto(address: UserAddress): UserAddressDto {
    return new UserAddressDto(
      address.id,
      address.userId,
      address.recipientName,
      address.recipientPhone,
      address.postalCode,
      address.addressDefaultText,
      address.addressDetailText,
      address.isDefault,
      address.createdAt,
      address.updatedAt,
    );
  }

  /**
   * UserAddress Entity[] → UserAddressDto[]
   */
  toDtoArray(addresses: UserAddress[]): UserAddressDto[] {
    return addresses.map((address) => this.toDto(address));
  }
}
