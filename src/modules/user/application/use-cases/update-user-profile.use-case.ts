import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { UserMapper } from '../mappers/user.mapper';
import { UserProfileDto, UpdateUserProfileDto } from '../dtos/user-profile.dto';

/**
 * FR-U-003: 프로필 수정 Use Case
 */
@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userMapper: UserMapper,
  ) {}

  async execute(
    userId: number,
    updateData: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    const updatedUser = await this.userDomainService.updateUserProfile(userId, {
      name: updateData.name,
      displayName: updateData.displayName,
      phoneNumber: updateData.phoneNumber,
    });

    return this.userMapper.toProfileDto(updatedUser);
  }
}
