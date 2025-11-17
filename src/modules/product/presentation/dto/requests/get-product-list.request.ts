import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 상품 목록 조회 요청 DTO
 */
export class GetProductListRequest {
  @ApiProperty({
    description: '카테고리 ID',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

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

  @ApiProperty({
    description: '정렬 기준',
    required: false,
    enum: ['newest', 'popular', 'price_low', 'price_high'],
    example: 'newest',
  })
  @IsOptional()
  @IsEnum(['newest', 'popular', 'price_low', 'price_high'])
  sortBy?: 'newest' | 'popular' | 'price_low' | 'price_high';
}
