/**
 * User 생성 속성
 */
export interface CreateUserProps {
  id: number;
  loginId: string;
  loginPassword: string;
  email: string;
  name: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  point?: number;
  lastLoginAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * User 도메인 엔티티
 */
export class User {
  private constructor(
    public readonly id: number,
    public readonly loginId: string,
    private loginPassword: string,
    public readonly email: string,
    public readonly name: string,
    public displayName: string | null,
    public phoneNumber: string | null,
    private point: number,
    public lastLoginAt: string | null,
    public deletedAt: string | null,
    public readonly createdAt: string,
    public updatedAt: string | null,
  ) {}

  /**
   * User 엔티티 생성 팩토리 메서드
   */
  static create(props: CreateUserProps): User {
    // 검증
    this.validateEmail(props.email);
    this.validatePoint(props.point ?? 0);

    return new User(
      props.id,
      props.loginId,
      props.loginPassword,
      props.email,
      props.name,
      props.displayName ?? null,
      props.phoneNumber ?? null,
      props.point ?? 0,
      props.lastLoginAt ?? null,
      props.deletedAt ?? null,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  chargePoint(amount: number): void {
    // TODO: 포인트 충전 로직 구현
    if (amount < 1000 || amount > 1_000_000) {
      // throw new InvalidChargeAmountError();
    }
    if (amount % 1000 !== 0) {
      // throw new InvalidChargeUnitError();
    }
    if (this.point + amount > 10_000_000) {
      // throw new MaxPointExceededError();
    }
    this.point += amount;
  }

  deductPoint(amount: number): void {
    // TODO: 포인트 차감 로직 구현
    if (this.point < amount) {
      //throw new InsufficientPointError();
    }
    this.point -= amount;
  }

  /**
   * 이메일 형식 검증
   */
  private static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * 포인트 검증
   */
  private static validatePoint(point: number): void {
    if (point < 0) {
      throw new Error('Point cannot be negative');
    }
    if (point > 10_000_000) {
      throw new Error('Point cannot exceed 10,000,000');
    }
  }

  getPoint(): number {
    return this.point;
  }
}
