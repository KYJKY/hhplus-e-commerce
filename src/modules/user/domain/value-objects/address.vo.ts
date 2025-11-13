import { ValueObject } from '../../../../common/domain/value-object.base';
import { PhoneNumber } from '../../../../common/domain/value-objects/phone-number.vo';
import { PostalCode } from './postal-code.vo';

interface AddressProps {
  recipientName: string;
  recipientPhone: PhoneNumber;
  postalCode: PostalCode;
  addressDefaultText: string;
  addressDetailText: string | null;
}

/**
 * 주소 Value Object
 *
 * 불변 객체로 배송지 정보를 표현
 * 복합 VO: recipientName, recipientPhone, postalCode, addressDefaultText, addressDetailText
 */
export class Address extends ValueObject<AddressProps> {
  private static readonly MIN_RECIPIENT_NAME_LENGTH = 2;
  private static readonly MAX_RECIPIENT_NAME_LENGTH = 50;
  private static readonly MAX_ADDRESS_LENGTH = 200;

  private constructor(props: AddressProps) {
    super(props);
  }

  /**
   * Address VO 생성 팩토리 메서드
   */
  static create(
    recipientName: string,
    recipientPhone: PhoneNumber,
    postalCode: PostalCode,
    addressDefaultText: string,
    addressDetailText?: string | null,
  ): Address {
    Address.validateRecipientName(recipientName);
    Address.validateAddressDefaultText(addressDefaultText);
    if (addressDetailText) {
      Address.validateAddressDetailText(addressDetailText);
    }

    return new Address({
      recipientName: recipientName.trim(),
      recipientPhone,
      postalCode,
      addressDefaultText: addressDefaultText.trim(),
      addressDetailText: addressDetailText?.trim() ?? null,
    });
  }

  /**
   * 수령인 이름 검증 (2~50자)
   */
  private static validateRecipientName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Recipient name is required');
    }

    const trimmedName = name.trim();
    if (
      trimmedName.length < Address.MIN_RECIPIENT_NAME_LENGTH ||
      trimmedName.length > Address.MAX_RECIPIENT_NAME_LENGTH
    ) {
      throw new Error(
        `Recipient name must be between ${Address.MIN_RECIPIENT_NAME_LENGTH} and ${Address.MAX_RECIPIENT_NAME_LENGTH} characters`,
      );
    }
  }

  /**
   * 기본 주소 검증
   */
  private static validateAddressDefaultText(addressDefaultText: string): void {
    if (!addressDefaultText || addressDefaultText.trim().length === 0) {
      throw new Error('Address is required');
    }

    if (addressDefaultText.trim().length > Address.MAX_ADDRESS_LENGTH) {
      throw new Error(
        `Address is too long (max ${Address.MAX_ADDRESS_LENGTH} characters)`,
      );
    }
  }

  /**
   * 상세 주소 검증
   */
  private static validateAddressDetailText(addressDetailText: string): void {
    if (addressDetailText.trim().length > Address.MAX_ADDRESS_LENGTH) {
      throw new Error(
        `Address detail is too long (max ${Address.MAX_ADDRESS_LENGTH} characters)`,
      );
    }
  }

  /**
   * 수령인 이름 반환
   */
  getRecipientName(): string {
    return this.props.recipientName;
  }

  /**
   * 수령인 전화번호 반환
   */
  getRecipientPhone(): PhoneNumber {
    return this.props.recipientPhone;
  }

  /**
   * 우편번호 반환
   */
  getPostalCode(): PostalCode {
    return this.props.postalCode;
  }

  /**
   * 기본 주소 반환
   */
  getAddressDefaultText(): string {
    return this.props.addressDefaultText;
  }

  /**
   * 상세 주소 반환
   */
  getAddressDetailText(): string | null {
    return this.props.addressDetailText;
  }

  /**
   * 전체 주소 반환 (기본 + 상세)
   */
  getFullAddress(): string {
    if (this.props.addressDetailText) {
      return `${this.props.addressDefaultText} ${this.props.addressDetailText}`;
    }
    return this.props.addressDefaultText;
  }

  /**
   * 값 반환 (전체 주소 정보)
   */
  getValue(): {
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    addressDefaultText: string;
    addressDetailText: string | null;
  } {
    return {
      recipientName: this.props.recipientName,
      recipientPhone: this.props.recipientPhone.getValue(),
      postalCode: this.props.postalCode.getValue(),
      addressDefaultText: this.props.addressDefaultText,
      addressDetailText: this.props.addressDetailText,
    };
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return `[${this.props.postalCode.getValue()}] ${this.getFullAddress()} (${this.props.recipientName}, ${this.props.recipientPhone.getFormatted()})`;
  }
}
