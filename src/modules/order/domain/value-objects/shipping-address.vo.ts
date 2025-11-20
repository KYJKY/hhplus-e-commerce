/**
 * 배송지 Value Object
 *
 * 주문 생성 시점의 배송지 정보를 스냅샷으로 저장
 * 이후 사용자가 배송지를 수정해도 주문의 배송지는 변경되지 않음
 */
export class ShippingAddress {
  private constructor(
    private readonly _recipientName: string,
    private readonly _recipientPhone: string,
    private readonly _postalCode: string,
    private readonly _addressDefaultText: string,
    private readonly _addressDetailText: string,
  ) {}

  get recipientName(): string {
    return this._recipientName;
  }

  get recipientPhone(): string {
    return this._recipientPhone;
  }

  get postalCode(): string {
    return this._postalCode;
  }

  get addressDefaultText(): string {
    return this._addressDefaultText;
  }

  get addressDetailText(): string {
    return this._addressDetailText;
  }

  /**
   * ShippingAddress 생성
   */
  static create(
    recipientName: string,
    recipientPhone: string,
    postalCode: string,
    addressDefaultText: string,
    addressDetailText: string,
  ): ShippingAddress {
    // 기본 검증
    if (!recipientName?.trim()) {
      throw new Error('Recipient name is required');
    }
    if (!recipientPhone?.trim()) {
      throw new Error('Recipient phone is required');
    }
    if (!postalCode?.trim()) {
      throw new Error('Postal code is required');
    }
    if (!addressDefaultText?.trim()) {
      throw new Error('Address default text is required');
    }
    if (!addressDetailText?.trim()) {
      throw new Error('Address detail text is required');
    }

    return new ShippingAddress(
      recipientName.trim(),
      recipientPhone.trim(),
      postalCode.trim(),
      addressDefaultText.trim(),
      addressDetailText.trim(),
    );
  }

  /**
   * 전체 주소 문자열 반환
   */
  getFullAddress(): string {
    return `[${this.postalCode}] ${this.addressDefaultText} ${this.addressDetailText}`;
  }

  /**
   * 동등성 비교
   */
  equals(other: ShippingAddress): boolean {
    return (
      this.recipientName === other.recipientName &&
      this.recipientPhone === other.recipientPhone &&
      this.postalCode === other.postalCode &&
      this.addressDefaultText === other.addressDefaultText &&
      this.addressDetailText === other.addressDetailText
    );
  }

  /**
   * JSON 직렬화
   */
  toJSON() {
    return {
      recipientName: this._recipientName,
      recipientPhone: this._recipientPhone,
      postalCode: this._postalCode,
      addressDefaultText: this._addressDefaultText,
      addressDetailText: this._addressDetailText,
    };
  }
}
