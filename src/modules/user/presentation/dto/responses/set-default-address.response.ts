import { ApiProperty } from '@nestjs/swagger';

/**
 * FR-U-009: 기본 배송지 설정 응답 DTO
 */
export class SetDefaultAddressResponse {
  @ApiProperty({ description: '기본 배송지로 설정된 배송지 ID', example: 1 })
  addressId: number;

  @ApiProperty({ description: '설정 성공 여부', example: true })
  success: boolean;
}
