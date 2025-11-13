import { ValueObject } from '../../../../common/domain/value-object.base';
import { InvalidZipCodeFormatException } from '../exceptions';

interface PostalCodeProps {
  value: string;
}

/**
 * 우편번호 Value Object
 *
 * 불변 객체로 우편번호를 표현
 * 검증 규칙: 5자리 숫자
 */
export class PostalCode extends ValueObject<PostalCodeProps> {
  private constructor(props: PostalCodeProps) {
    super(props);
  }

  /**
   * PostalCode VO 생성 팩토리 메서드
   * @param value - 우편번호 (5자리 숫자)
   */
  static create(value: string): PostalCode {
    PostalCode.validate(value);
    return new PostalCode({ value });
  }

  /**
   * 우편번호 검증 (5자리 숫자)
   */
  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new InvalidZipCodeFormatException();
    }

    const postalCodeRegex = /^\d{5}$/;
    if (!postalCodeRegex.test(value)) {
      throw new InvalidZipCodeFormatException();
    }
  }

  /**
   * 값 반환
   */
  getValue(): string {
    return this.props.value;
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this.props.value;
  }
}
