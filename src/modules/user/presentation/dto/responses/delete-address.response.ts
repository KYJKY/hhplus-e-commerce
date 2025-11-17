import { ApiProperty } from '@nestjs/swagger';

/**
 * FR-U-008: 배송지 삭제 응답 DTO
 */
export class DeleteAddressResponse {
  @ApiProperty({ description: '삭제 성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '삭제된 배송지 ID', example: 1 })
  deletedAddressId: number;
}
