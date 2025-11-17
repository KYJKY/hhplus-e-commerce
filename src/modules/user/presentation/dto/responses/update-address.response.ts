import { ApiProperty } from '@nestjs/swagger';

/**
 * FR-U-007: 배송지 수정 응답 DTO
 */
export class UpdateAddressResponse {
  @ApiProperty({ description: '배송지 ID', example: 1 })
  addressId: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '수정된 수령인 이름', example: '홍길동' })
  recipientName: string;

  @ApiProperty({
    description: '수정된 수령인 전화번호',
    example: '010-1234-5678',
  })
  recipientPhone: string;

  @ApiProperty({ description: '수정된 우편번호', example: '12345' })
  postalCode: string;

  @ApiProperty({
    description: '수정된 기본 주소',
    example: '서울시 강남구 테헤란로 123',
  })
  addressDefaultText: string;

  @ApiProperty({
    description: '수정된 상세 주소',
    example: '456호',
    nullable: true,
  })
  addressDetailText: string | null;

  @ApiProperty({ description: '기본 배송지 여부', example: false })
  isDefault: boolean;

  @ApiProperty({ description: '수정일시', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: string;
}
