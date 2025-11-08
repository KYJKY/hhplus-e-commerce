import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * 프로필 정보 DTO
 */
export class ProfileDto {
  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '닉네임', example: '길동이', nullable: true })
  displayName: string | null;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    nullable: true,
  })
  phoneNumber: string | null;
}

/**
 * FR-U-001: 사용자 조회 응답 DTO
 */
export class GetUserResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '이메일', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '프로필 정보', type: ProfileDto })
  profile: ProfileDto;

  @ApiProperty({ description: '가입일시', example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;
}

/**
 * FR-U-002: 프로필 조회 응답 DTO
 */
export class GetProfileResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '닉네임', example: '길동이', nullable: true })
  displayName: string | null;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    nullable: true,
  })
  phoneNumber: string | null;

  @ApiProperty({
    description: '마지막 수정 일시',
    example: '2024-01-01T00:00:00.000Z',
    nullable: true,
  })
  updatedAt: string | null;
}

/**
 * FR-U-003: 프로필 수정 요청 DTO
 */
export class UpdateProfileRequestDto {
  @ApiPropertyOptional({
    description: '사용자 이름 (2~50자)',
    example: '홍길동',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: '닉네임 (2~20자)',
    example: '길동이',
    minLength: 2,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  displayName?: string;

  @ApiPropertyOptional({
    description: '전화번호 (하이픈 포함/제외 가능)',
    example: '010-1234-5678',
    pattern: '^(\\d{2,3}-?\\d{3,4}-?\\d{4})$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\d{2,3}-?\d{3,4}-?\d{4})$/, {
    message: 'Invalid phone number format',
  })
  phoneNumber?: string;
}

/**
 * FR-U-003: 프로필 수정 응답 DTO
 */
export class UpdateProfileResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '수정된 사용자 이름', example: '홍길동' })
  name: string;

  @ApiProperty({
    description: '수정된 닉네임',
    example: '길동이',
    nullable: true,
  })
  displayName: string | null;

  @ApiProperty({
    description: '수정된 전화번호',
    example: '010-1234-5678',
    nullable: true,
  })
  phoneNumber: string | null;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}
