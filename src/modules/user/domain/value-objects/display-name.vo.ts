import { ValueObject } from '../../../../common/domain/value-object.base';
import { InvalidDisplayNameLengthException } from '../exceptions';

interface DisplayNameProps {
  value: string;
}

/**
 * 닉네임 Value Object
 *
 * 불변 객체로 사용자 닉네임을 표현
 * 검증 규칙: 2~20자
 */
export class DisplayName extends ValueObject<DisplayNameProps> {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 20;

  private constructor(props: DisplayNameProps) {
    super(props);
  }

  /**
   * DisplayName VO 생성 팩토리 메서드
   * @param value - 닉네임 (2~20자)
   */
  static create(value: string): DisplayName {
    DisplayName.validate(value);
    return new DisplayName({ value: value.trim() });
  }

  /**
   * 닉네임 검증 (2~20자)
   */
  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new InvalidDisplayNameLengthException();
    }

    const trimmedValue = value.trim();
    if (
      trimmedValue.length < DisplayName.MIN_LENGTH ||
      trimmedValue.length > DisplayName.MAX_LENGTH
    ) {
      throw new InvalidDisplayNameLengthException();
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
