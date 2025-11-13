import { PhoneNumber } from '../../../../common/domain/value-objects/phone-number.vo';
import { PostalCode } from '../value-objects/postal-code.vo';
import {
  InvalidRecipientNameException,
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
 * UserAddress 도메인 엔티티 (VO 적용)
 *
 * Value Object 사용:
 * - PhoneNumber: 수령인 전화번호 검증
 * - PostalCode: 우편번호 검증 (5자리)
 * - recipientName, addressDefaultText, addressDetailText: 문자열 검증
 */
export class UserAddress {
  private static readonly MIN_RECIPIENT_NAME_LENGTH = 2;
  private static readonly MAX_RECIPIENT_NAME_LENGTH = 50;
  private static readonly MAX_ADDRESS_LENGTH = 200;

  private constructor(
    public readonly id: number,
    public readonly userId: number,
    private _recipientName: string,
    private _recipientPhone: PhoneNumber,
    private _postalCode: PostalCode,
    private _addressDefaultText: string,
    private _addressDetailText: string | null,
    public isDefault: boolean,
    public readonly createdAt: string,
    public updatedAt: string | null,
  ) {}

  // ===== Getter 메서드 (기존 코드 호환성 유지) =====

  /**
   * 수령인 이름 반환 (기존 코드 호환)
   */
  get recipientName(): string {
    return this._recipientName;
  }

  /**
   * 수령인 전화번호 문자열 반환 (기존 코드 호환)
   */
  get recipientPhone(): string {
    return this._recipientPhone.getValue();
  }

  /**
   * 우편번호 문자열 반환 (기존 코드 호환)
   */
  get postalCode(): string {
    return this._postalCode.getValue();
  }

  /**
   * 기본 주소 반환 (기존 코드 호환)
   */
  get addressDefaultText(): string {
    return this._addressDefaultText;
  }

  /**
   * 상세 주소 반환 (기존 코드 호환)
   */
  get addressDetailText(): string | null {
    return this._addressDetailText;
  }

  // ===== VO Getter 메서드 (새로운 코드에서 사용) =====

  /**
   * PhoneNumber VO 반환
   */
  getRecipientPhoneVO(): PhoneNumber {
    return this._recipientPhone;
  }

  /**
   * PostalCode VO 반환
   */
  getPostalCodeVO(): PostalCode {
    return this._postalCode;
  }

  /**
   * 전체 주소 반환 (기본 + 상세)
   */
  getFullAddress(): string {
    if (this._addressDetailText) {
      return `${this._addressDefaultText} ${this._addressDetailText}`;
    }
    return this._addressDefaultText;
  }

  /**
   * UserAddress 엔티티 생성 팩토리 메서드
   * VO를 생성하여 검증을 VO에 위임
   */
  static create(props: CreateUserAddressProps): UserAddress {
    // 검증
    UserAddress.validateRecipientName(props.recipientName);
    UserAddress.validateAddressDefaultText(props.addressDefaultText);
    if (props.addressDetailText) {
      UserAddress.validateAddressDetailText(props.addressDetailText);
    }

    // VO 생성 (검증은 VO 내부에서 수행)
    const recipientPhone = PhoneNumber.create(props.recipientPhone);
    const postalCode = PostalCode.create(props.postalCode);

    return new UserAddress(
      props.id,
      props.userId,
      props.recipientName.trim(),
      recipientPhone,
      postalCode,
      props.addressDefaultText.trim(),
      props.addressDetailText?.trim() ?? null,
      props.isDefault,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  /**
   * 배송지 정보 수정
   * VO를 사용하여 검증
   */
  update(props: UpdateUserAddressProps): void {
    if (props.recipientName !== undefined) {
      UserAddress.validateRecipientName(props.recipientName);
      this._recipientName = props.recipientName.trim();
    }

    if (props.recipientPhone !== undefined) {
      this._recipientPhone = PhoneNumber.create(props.recipientPhone);
    }

    if (props.postalCode !== undefined) {
      this._postalCode = PostalCode.create(props.postalCode);
    }

    if (props.addressDefaultText !== undefined) {
      UserAddress.validateAddressDefaultText(props.addressDefaultText);
      this._addressDefaultText = props.addressDefaultText.trim();
    }

    if (props.addressDetailText !== undefined) {
      if (props.addressDetailText) {
        UserAddress.validateAddressDetailText(props.addressDetailText);
      }
      this._addressDetailText = props.addressDetailText?.trim() ?? null;
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
    if (!name || name.trim().length === 0) {
      throw new InvalidRecipientNameException();
    }

    const trimmedName = name.trim();
    if (
      trimmedName.length < UserAddress.MIN_RECIPIENT_NAME_LENGTH ||
      trimmedName.length > UserAddress.MAX_RECIPIENT_NAME_LENGTH
    ) {
      throw new InvalidRecipientNameException();
    }
  }

  /**
   * 기본 주소 검증
   */
  private static validateAddressDefaultText(addressDefaultText: string): void {
    if (!addressDefaultText || addressDefaultText.trim().length === 0) {
      throw new InvalidAddressException('Address is required');
    }
    if (addressDefaultText.trim().length > UserAddress.MAX_ADDRESS_LENGTH) {
      throw new InvalidAddressException(
        `Address is too long (max ${UserAddress.MAX_ADDRESS_LENGTH} characters)`,
      );
    }
  }

  /**
   * 상세 주소 검증
   */
  private static validateAddressDetailText(addressDetailText: string): void {
    if (addressDetailText.trim().length > UserAddress.MAX_ADDRESS_LENGTH) {
      throw new InvalidAddressException(
        `Address detail is too long (max ${UserAddress.MAX_ADDRESS_LENGTH} characters)`,
      );
    }
  }
}
