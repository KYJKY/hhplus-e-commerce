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
  recipientPhone: string;
  postalCode: string;
  addressDefaultText: string;
  addressDetailText?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * UserAddress 수정 속성
 */
export interface UpdateUserAddressProps {
  recipientName?: string;
  recipientPhone?: string;
  postalCode?: string;
  addressDefaultText?: string;
  addressDetailText?: string | null;
}

/**
 * UserAddress 도메인 엔티티
 */
export class UserAddress {
  private constructor(
    public readonly id: number,
    public readonly userId: number,
    public recipientName: string,
    public recipientPhone: string,
    public postalCode: string,
    public addressDefaultText: string,
    public addressDetailText: string | null,
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
    this.validateRecipientPhone(props.recipientPhone);
    this.validatePostalCode(props.postalCode);
    this.validateAddressDefaultText(props.addressDefaultText);

    return new UserAddress(
      props.id,
      props.userId,
      props.recipientName,
      props.recipientPhone,
      props.postalCode,
      props.addressDefaultText,
      props.addressDetailText ?? null,
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

    if (props.recipientPhone !== undefined) {
      UserAddress.validateRecipientPhone(props.recipientPhone);
      this.recipientPhone = props.recipientPhone;
    }

    if (props.postalCode !== undefined) {
      UserAddress.validatePostalCode(props.postalCode);
      this.postalCode = props.postalCode;
    }

    if (props.addressDefaultText !== undefined) {
      UserAddress.validateAddressDefaultText(props.addressDefaultText);
      this.addressDefaultText = props.addressDefaultText;
    }

    if (props.addressDetailText !== undefined) {
      this.addressDetailText = props.addressDetailText ?? null;
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
  private static validateRecipientPhone(recipientPhone: string): void {
    const phoneRegex = /^(\d{2,3}-?\d{3,4}-?\d{4})$/;
    if (!recipientPhone || !phoneRegex.test(recipientPhone)) {
      throw new InvalidPhoneNumberFormatException();
    }
  }

  /**
   * 우편번호 검증 (5자리 숫자)
   */
  private static validatePostalCode(postalCode: string): void {
    const postalCodeRegex = /^\d{5}$/;
    if (!postalCode || !postalCodeRegex.test(postalCode)) {
      throw new InvalidZipCodeFormatException();
    }
  }

  /**
   * 기본 주소 검증
   */
  private static validateAddressDefaultText(addressDefaultText: string): void {
    if (!addressDefaultText || addressDefaultText.trim().length === 0) {
      throw new InvalidAddressException('Address is required');
    }
    if (addressDefaultText.trim().length > 200) {
      throw new InvalidAddressException(
        'Address is too long (max 200 characters)',
      );
    }
  }
}
