/**
 * Value Object 기본 추상 클래스
 *
 * DDD의 Value Object 특징:
 * 1. 불변성(Immutability): 한 번 생성되면 변경할 수 없다
 * 2. 값 동등성(Value Equality): 식별자가 아닌 모든 속성 값으로 동등성 판단
 * 3. 자체 검증(Self-validation): 생성 시 유효성 검증
 * 4. 부작용 없음(Side-effect free): 메서드 호출 시 새로운 VO 반환
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * 값 동등성 비교
   */
  equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return this.shallowEqual(this.props, vo.props);
  }

  /**
   * 얕은 동등성 비교
   */
  private shallowEqual(props1: T, props2: T): boolean {
    const keys1 = Object.keys(props1 as object);
    const keys2 = Object.keys(props2 as object);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (
        (props1 as Record<string, unknown>)[key] !==
        (props2 as Record<string, unknown>)[key]
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * 값 반환
   */
  abstract getValue(): any;
}
