import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserProfileDto, UserInfoDto } from '../dtos/user-profile.dto';

/**
 * User Mapper
 *
 * Domain Entity ↔ Application DTO 변환
 * Presentation Layer와 Domain Layer를 격리
 */
@Injectable()
export class UserMapper {
  /**
   * User Entity → UserProfileDto
   */
  toProfileDto(user: User): UserProfileDto {
    return new UserProfileDto(
      user.id,
      user.name,
      user.displayName,
      user.phoneNumber,
      user.updatedAt,
    );
  }

  /**
   * User Entity → UserInfoDto
   */
  toInfoDto(user: User): UserInfoDto {
    return new UserInfoDto(
      user.id,
      user.email,
      user.name,
      user.displayName,
      user.phoneNumber,
      user.createdAt,
    );
  }
}
