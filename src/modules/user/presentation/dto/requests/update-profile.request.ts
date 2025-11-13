import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * FR-U-003: 프로필 수정 요청 DTO
 */
export class UpdateProfileRequest {
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
