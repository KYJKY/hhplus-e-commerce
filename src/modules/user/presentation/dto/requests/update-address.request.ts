import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * FR-U-007: 배송지 수정 요청 DTO
 */
export class UpdateAddressRequest {
  @ApiPropertyOptional({
    description: '수령인 이름 (2~50자)',
    example: '홍길동',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  recipientName?: string;

  @ApiPropertyOptional({
    description: '수령인 전화번호 (하이픈 포함/제외 가능)',
    example: '010-1234-5678',
    pattern: '^(\\d{2,3}-?\\d{3,4}-?\\d{4})$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\d{2,3}-?\d{3,4}-?\d{4})$/, {
    message: 'Invalid phone number format',
  })
  recipientPhone?: string;

  @ApiPropertyOptional({
    description: '우편번호 (5자리 숫자)',
    example: '12345',
    pattern: '^\\d{5}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, {
    message: 'Zip code must be 5 digits',
  })
  postalCode?: string;

  @ApiPropertyOptional({
    description: '기본 주소',
    example: '서울시 강남구 테헤란로 123',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressDefaultText?: string;

  @ApiPropertyOptional({
    description: '상세 주소',
    example: '456호',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressDetailText?: string;
}
