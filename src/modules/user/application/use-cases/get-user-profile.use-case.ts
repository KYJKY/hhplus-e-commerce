import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { UserMapper } from '../mappers/user.mapper';
import { UserProfileDto } from '../dtos/user-profile.dto';

/**
 * FR-U-002: 프로필 조회 Use Case
 */
@Injectable()
export class GetUserProfileUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userMapper: UserMapper,
  ) {}

  async execute(userId: number): Promise<UserProfileDto> {
    const user = await this.userDomainService.findUserById(userId);
    return this.userMapper.toProfileDto(user);
  }
}
