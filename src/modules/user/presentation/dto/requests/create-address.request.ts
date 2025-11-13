import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * FR-U-006: 배송지 추가 요청 DTO
 */
export class CreateAddressRequest {
  @ApiProperty({
    description: '수령인 이름 (2~50자)',
    example: '홍길동',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  recipientName: string;

  @ApiProperty({
    description: '수령인 전화번호 (하이픈 포함/제외 가능)',
    example: '010-1234-5678',
    pattern: '^(\\d{2,3}-?\\d{3,4}-?\\d{4})$',
  })
  @IsString()
  @Matches(/^(\d{2,3}-?\d{3,4}-?\d{4})$/, {
    message: 'Invalid phone number format',
  })
  recipientPhone: string;

  @ApiProperty({
    description: '우편번호 (5자리 숫자)',
    example: '12345',
    pattern: '^\\d{5}$',
  })
  @IsString()
  @Matches(/^\d{5}$/, {
    message: 'Zip code must be 5 digits',
  })
  postalCode: string;

  @ApiProperty({
    description: '주소',
    example: '서울시 강남구 테헤란로 123',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  addressDefaultText: string;

  @ApiPropertyOptional({
    description: '상세 주소',
    example: '456호',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressDetailText?: string;

  @ApiPropertyOptional({
    description: '기본 배송지 설정 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
