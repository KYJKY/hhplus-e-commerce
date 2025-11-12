import { Injectable } from '@nestjs/common';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { UserMapper } from '../mappers/user.mapper';
import { UserInfoDto } from '../dtos/user-profile.dto';

/**
 * FR-U-001: 사용자 조회 Use Case
 */
@Injectable()
export class GetUserInfoUseCase {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userMapper: UserMapper,
  ) {}

  async execute(userId: number): Promise<UserInfoDto> {
    const user = await this.userDomainService.findUserById(userId);
    return this.userMapper.toInfoDto(user);
  }
}
