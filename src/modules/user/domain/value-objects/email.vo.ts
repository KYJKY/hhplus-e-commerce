import { ValueObject } from '../../../../common/domain/value-object.base';

interface EmailProps {
  value: string;
}

/**
 * 이메일 Value Object
 *
 * 불변 객체로 이메일을 표현
 */
export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  /**
   * Email VO 생성 팩토리 메서드
   * @param value - 이메일 주소
   */
  static create(value: string): Email {
    Email.validate(value);
    return new Email({ value: value.toLowerCase().trim() });
  }

  /**
   * 이메일 검증
   */
  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * 값 반환
   */
  getValue(): string {
    return this.props.value;
  }

  /**
   * 도메인 추출
   */
  getDomain(): string {
    return this.props.value.split('@')[1];
  }

  /**
   * 로컬 파트 추출 (@ 앞부분)
   */
  getLocalPart(): string {
    return this.props.value.split('@')[0];
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this.props.value;
  }
}
