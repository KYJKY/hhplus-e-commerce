import {
  InvalidRecipientNameException,
  InvalidPhoneNumberFormatException,
  InvalidZipCodeFormatException,
  InvalidAddressException,
} from '../exceptions';

/**
 * UserAddress 생성 속성
 */
export interface CreateUserAddressProps {
  id: number;
  userId: number;
  recipientName: string;
  phoneNumber: string;
  zipCode: string;
  address: string;
  detailAddress?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * UserAddress 수정 속성
 */
export interface UpdateUserAddressProps {
  recipientName?: string;
  phoneNumber?: string;
  zipCode?: string;
  address?: string;
  detailAddress?: string | null;
}

/**
 * UserAddress 도메인 엔티티
 */
export class UserAddress {
  private constructor(
    public readonly id: number,
    public readonly userId: number,
    public recipientName: string,
    public phoneNumber: string,
    public zipCode: string,
    public address: string,
    public detailAddress: string | null,
    public isDefault: boolean,
    public readonly createdAt: string,
    public updatedAt: string | null,
  ) {}

  /**
   * UserAddress 엔티티 생성 팩토리 메서드
   */
  static create(props: CreateUserAddressProps): UserAddress {
    // 검증
    this.validateRecipientName(props.recipientName);
    this.validatePhoneNumber(props.phoneNumber);
    this.validateZipCode(props.zipCode);
    this.validateAddress(props.address);

    return new UserAddress(
      props.id,
      props.userId,
      props.recipientName,
      props.phoneNumber,
      props.zipCode,
      props.address,
      props.detailAddress ?? null,
      props.isDefault,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  /**
   * 배송지 정보 수정
   */
  update(props: UpdateUserAddressProps): void {
    if (props.recipientName !== undefined) {
      UserAddress.validateRecipientName(props.recipientName);
      this.recipientName = props.recipientName;
    }

    if (props.phoneNumber !== undefined) {
      UserAddress.validatePhoneNumber(props.phoneNumber);
      this.phoneNumber = props.phoneNumber;
    }

    if (props.zipCode !== undefined) {
      UserAddress.validateZipCode(props.zipCode);
      this.zipCode = props.zipCode;
    }

    if (props.address !== undefined) {
      UserAddress.validateAddress(props.address);
      this.address = props.address;
    }

    if (props.detailAddress !== undefined) {
      this.detailAddress = props.detailAddress ?? null;
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * 기본 배송지로 설정
   */
  setAsDefault(): void {
    this.isDefault = true;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 기본 배송지 해제
   */
  unsetAsDefault(): void {
    this.isDefault = false;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 수령인 이름 검증 (2~50자)
   */
  private static validateRecipientName(name: string): void {
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      throw new InvalidRecipientNameException();
    }
  }

  /**
   * 수령인 전화번호 형식 검증
   * 하이픈 포함 또는 제외 형식 모두 허용
   * 예: 010-1234-5678, 01012345678
   */
  private static validatePhoneNumber(phoneNumber: string): void {
    const phoneRegex = /^(\d{2,3}-?\d{3,4}-?\d{4})$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      throw new InvalidPhoneNumberFormatException();
    }
  }

  /**
   * 우편번호 검증 (5자리 숫자)
   */
  private static validateZipCode(zipCode: string): void {
    const zipCodeRegex = /^\d{5}$/;
    if (!zipCode || !zipCodeRegex.test(zipCode)) {
      throw new InvalidZipCodeFormatException();
    }
  }

  /**
   * 기본 주소 검증
   */
  private static validateAddress(address: string): void {
    if (!address || address.trim().length === 0) {
      throw new InvalidAddressException('Address is required');
    }
    if (address.trim().length > 200) {
      throw new InvalidAddressException(
        'Address is too long (max 200 characters)',
      );
    }
  }
}
