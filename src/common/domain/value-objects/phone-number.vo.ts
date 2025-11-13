import { ValueObject } from '../value-object.base';
import { InvalidPhoneNumberFormatException } from '../../../modules/user/domain/exceptions';

interface PhoneNumberProps {
  value: string;
}

/**
 * 전화번호 Value Object
 *
 * 불변 객체로 전화번호를 표현
 * User와 UserAddress 모듈에서 공통으로 사용
 *
 * 형식: 하이픈 포함 또는 제외 모두 허용
 * 예: 010-1234-5678, 01012345678
 */
export class PhoneNumber extends ValueObject<PhoneNumberProps> {
  private constructor(props: PhoneNumberProps) {
    super(props);
  }

  /**
   * PhoneNumber VO 생성 팩토리 메서드
   * @param value - 전화번호 (하이픈 포함/제외 가능)
   */
  static create(value: string): PhoneNumber {
    PhoneNumber.validate(value);
    return new PhoneNumber({ value });
  }

  /**
   * 전화번호 검증
   * 하이픈 포함 또는 제외 형식 모두 허용
   * 예: 010-1234-5678, 01012345678
   */
  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new InvalidPhoneNumberFormatException();
    }

    const phoneRegex = /^(\d{2,3}-?\d{3,4}-?\d{4})$/;
    if (!phoneRegex.test(value)) {
      throw new InvalidPhoneNumberFormatException();
    }
  }

  /**
   * 값 반환
   */
  getValue(): string {
    return this.props.value;
  }

  /**
   * 하이픈 포함 형식으로 반환
   */
  getFormatted(): string {
    const cleaned = this.props.value.replace(/-/g, '');

    // 010-1234-5678 형식
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }

    // 02-1234-5678 형식 (서울 지역번호)
    if (cleaned.length === 10 && cleaned.startsWith('02')) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }

    // 031-123-4567 형식
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return this.props.value;
  }

  /**
   * 하이픈 제거한 숫자만 반환
   */
  getDigitsOnly(): string {
    return this.props.value.replace(/-/g, '');
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this.getFormatted();
  }
}
