/**
 * Application Layer DTO - User Address
 * Use Case의 입출력을 정의하며, Domain과 Presentation Layer를 격리
 */

/**
 * 배송지 정보
 */
export class UserAddressDto {
  constructor(
    public readonly addressDefaultTextId: number,
    public readonly userId: number,
    public readonly recipientName: string,
    public readonly recipientPhone: string,
    public readonly postalCode: string,
    public readonly addressDefaultText: string,
    public readonly addressDetailText: string | null,
    public readonly isDefault: boolean,
    public readonly createdAt: string,
    public readonly updatedAt: string | null,
  ) {}
}

/**
 * 배송지 생성 입력
 */
export class CreateAddressDto {
  constructor(
    public readonly recipientName: string,
    public readonly recipientPhone: string,
    public readonly postalCode: string,
    public readonly addressDefaultText: string,
    public readonly addressDetailText?: string,
    public readonly isDefault?: boolean,
  ) {}
}

/**
 * 배송지 수정 입력
 */
export class UpdateAddressDto {
  constructor(
    public readonly recipientName?: string,
    public readonly recipientPhone?: string,
    public readonly postalCode?: string,
    public readonly addressDefaultText?: string,
    public readonly addressDetailText?: string,
  ) {}
}
