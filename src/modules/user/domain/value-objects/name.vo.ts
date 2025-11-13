import { ValueObject } from '../../../../common/domain/value-object.base';
import { InvalidNameLengthException } from '../exceptions';

interface NameProps {
  value: string;
}

/**
 * 이름 Value Object
 *
 * 불변 객체로 사용자 이름을 표현
 * 검증 규칙: 2~50자
 */
export class Name extends ValueObject<NameProps> {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 50;

  private constructor(props: NameProps) {
    super(props);
  }

  /**
   * Name VO 생성 팩토리 메서드
   * @param value - 이름 (2~50자)
   */
  static create(value: string): Name {
    Name.validate(value);
    return new Name({ value: value.trim() });
  }

  /**
   * 이름 검증 (2~50자)
   */
  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new InvalidNameLengthException();
    }

    const trimmedValue = value.trim();
    if (
      trimmedValue.length < Name.MIN_LENGTH ||
      trimmedValue.length > Name.MAX_LENGTH
    ) {
      throw new InvalidNameLengthException();
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
