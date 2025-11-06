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
 * 배송지 정보 DTO (공통)
 */
export class AddressDto {
  @ApiProperty({ description: '배송지 ID', example: 1 })
  addressId: number;

  @ApiProperty({ description: '수령인 이름', example: '홍길동' })
  recipientName: string;

  @ApiProperty({ description: '수령인 전화번호', example: '010-1234-5678' })
  recipientPhone: string;

  @ApiProperty({ description: '우편번호', example: '12345' })
  postalCode: string;

  @ApiProperty({ description: '주소', example: '서울시 강남구 테헤란로 123' })
  addressDefaultText: string;

  @ApiProperty({ description: '상세 주소', example: '456호', nullable: true })
  addressDetailText: string | null;

  @ApiProperty({ description: '기본 배송지 여부', example: true })
  isDefault: boolean;

  @ApiProperty({ description: '등록일시', example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;
}

/**
 * FR-U-004: 배송지 목록 조회 응답 DTO
 */
export class GetAddressListResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '배송지 목록', type: [AddressDto] })
  addresses: AddressDto[];
}

/**
 * FR-U-005: 배송지 상세 조회 응답 DTO
 */
export class GetAddressDetailResponseDto {
  @ApiProperty({ description: '배송지 ID', example: 1 })
  addressId: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '수령인 이름', example: '홍길동' })
  recipientName: string;

  @ApiProperty({ description: '수령인 전화번호', example: '010-1234-5678' })
  recipientPhone: string;

  @ApiProperty({ description: '우편번호', example: '12345' })
  postalCode: string;

  @ApiProperty({ description: '주소', example: '서울시 강남구 테헤란로 123' })
  addressDefaultText: string;

  @ApiProperty({ description: '상세 주소', example: '456호', nullable: true })
  addressDetailText: string | null;

  @ApiProperty({ description: '기본 배송지 여부', example: true })
  isDefault: boolean;

  @ApiProperty({ description: '등록일시', example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00.000Z',
    nullable: true,
  })
  updatedAt: string | null;
}

/**
 * FR-U-006: 배송지 추가 요청 DTO
 */
export class CreateAddressRequestDto {
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
  detailAddress?: string;

  @ApiPropertyOptional({
    description: '기본 배송지 설정 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/**
 * FR-U-006: 배송지 추가 응답 DTO
 */
export class CreateAddressResponseDto {
  @ApiProperty({ description: '생성된 배송지 ID', example: 1 })
  addressId: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '수령인 이름', example: '홍길동' })
  recipientName: string;

  @ApiProperty({ description: '수령인 전화번호', example: '010-1234-5678' })
  recipientPhone: string;

  @ApiProperty({ description: '우편번호', example: '12345' })
  postalCode: string;

  @ApiProperty({ description: '주소', example: '서울시 강남구 테헤란로 123' })
  addressDefaultText: string;

  @ApiProperty({ description: '상세 주소', example: '456호', nullable: true })
  addressDetailText: string | null;

  @ApiProperty({ description: '기본 배송지 여부', example: false })
  isDefault: boolean;

  @ApiProperty({ description: '등록일시', example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;
}

/**
 * FR-U-007: 배송지 수정 요청 DTO
 */
export class UpdateAddressRequestDto {
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
  phoneNumber?: string;

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
  zipCode?: string;

  @ApiPropertyOptional({
    description: '주소',
    example: '서울시 강남구 테헤란로 123',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({
    description: '상세 주소',
    example: '456호',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  detailAddress?: string;
}

/**
 * FR-U-007: 배송지 수정 응답 DTO
 */
export class UpdateAddressResponseDto {
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
    description: '수정된 주소',
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

/**
 * FR-U-008: 배송지 삭제 응답 DTO
 */
export class DeleteAddressResponseDto {
  @ApiProperty({ description: '삭제 성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '삭제된 배송지 ID', example: 1 })
  deletedAddressId: number;
}

/**
 * FR-U-009: 기본 배송지 설정 응답 DTO
 */
export class SetDefaultAddressResponseDto {
  @ApiProperty({ description: '기본 배송지로 설정된 배송지 ID', example: 1 })
  addressId: number;

  @ApiProperty({ description: '설정 성공 여부', example: true })
  success: boolean;
}

/**
 * FR-U-010: 기본 배송지 조회 응답 DTO
 */
export class GetDefaultAddressResponseDto {
  @ApiProperty({ description: '배송지 ID', example: 1 })
  addressId: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '수령인 이름', example: '홍길동' })
  recipientName: string;

  @ApiProperty({ description: '수령인 전화번호', example: '010-1234-5678' })
  recipientPhone: string;

  @ApiProperty({ description: '우편번호', example: '12345' })
  postalCode: string;

  @ApiProperty({ description: '주소', example: '서울시 강남구 테헤란로 123' })
  addressDefaultText: string;

  @ApiProperty({ description: '상세 주소', example: '456호', nullable: true })
  addressDetailText: string | null;

  @ApiProperty({ description: '기본 배송지 여부 (항상 true)', example: true })
  isDefault: boolean;
}
