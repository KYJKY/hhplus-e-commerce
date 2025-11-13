import { ApiProperty } from '@nestjs/swagger';

/**
 * FR-U-003: 프로필 수정 응답 DTO
 */
export class UpdateProfileResponse {
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
