import { ApiProperty } from '@nestjs/swagger';

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
export class GetUserResponse {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '이메일', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '프로필 정보', type: ProfileDto })
  profile: ProfileDto;

  @ApiProperty({ description: '가입일시', example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;
}
