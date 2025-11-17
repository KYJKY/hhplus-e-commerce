import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 결제 내역 조회 요청 DTO
 */
export class GetPaymentsRequest {
  @ApiProperty({
    description: '결제 상태 필터',
    enum: ['SUCCESS', 'FAILED', 'CANCELLED'],
    required: false,
    example: 'SUCCESS',
  })
  @IsOptional()
  @IsEnum(['SUCCESS', 'FAILED', 'CANCELLED'])
  status?: 'SUCCESS' | 'FAILED' | 'CANCELLED';

  @ApiProperty({
    description: '페이지 번호',
    required: false,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: '페이지 크기',
    required: false,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  size?: number;
}
