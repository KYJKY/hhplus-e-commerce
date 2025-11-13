import { ApiProperty } from '@nestjs/swagger';

/**
 * FR-U-002: 프로필 조회 응답 DTO
 */
export class GetProfileResponse {
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
