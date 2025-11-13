import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 포인트 사용 내역 조회 요청 DTO
 */
export class GetPointTransactionsRequest {
  @ApiProperty({
    description: '거래 유형 필터',
    enum: ['CHARGE', 'USE', 'REFUND'],
    required: false,
    example: 'CHARGE',
  })
  @IsOptional()
  @IsEnum(['CHARGE', 'USE', 'REFUND'])
  transactionType?: 'CHARGE' | 'USE' | 'REFUND';

  @ApiProperty({
    description: '조회 시작 일자',
    required: false,
    example: '2024-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '조회 종료 일자',
    required: false,
    example: '2024-11-05T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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
