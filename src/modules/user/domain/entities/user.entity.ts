import {
  InvalidNameLengthException,
  InvalidDisplayNameLengthException,
  InvalidPhoneNumberFormatException,
} from '../exceptions';

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
 * User 프로필 수정 속성
 */
export interface UpdateUserProfileProps {
  name?: string;
  displayName?: string;
  phoneNumber?: string;
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
    this.validateName(props.name);
    if (props.displayName) {
      this.validateDisplayName(props.displayName);
    }
    if (props.phoneNumber) {
      this.validatePhoneNumber(props.phoneNumber);
    }
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

  /**
   * 프로필 수정
   */
  updateProfile(props: UpdateUserProfileProps): void {
    if (props.name !== undefined) {
      User.validateName(props.name);
      // name은 readonly이므로 직접 수정 불가, 새로운 방식 필요
      // 하지만 엔티티 내부에서는 수정 가능하도록 처리
      (this as any).name = props.name;
    }

    if (props.displayName !== undefined) {
      if (props.displayName) {
        User.validateDisplayName(props.displayName);
      }
      this.displayName = props.displayName;
    }

    if (props.phoneNumber !== undefined) {
      if (props.phoneNumber) {
        User.validatePhoneNumber(props.phoneNumber);
      }
      this.phoneNumber = props.phoneNumber;
    }

    this.updatedAt = new Date().toISOString();
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
   * 이름 검증 (2~50자)
   */
  private static validateName(name: string): void {
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      throw new InvalidNameLengthException();
    }
  }

  /**
   * 닉네임 검증 (2~20자)
   */
  private static validateDisplayName(displayName: string): void {
    if (!displayName || displayName.trim().length < 2 || displayName.trim().length > 20) {
      throw new InvalidDisplayNameLengthException();
    }
  }

  /**
   * 전화번호 형식 검증
   * 하이픈 포함 또는 제외 형식 모두 허용
   * 예: 010-1234-5678, 01012345678
   */
  private static validatePhoneNumber(phoneNumber: string): void {
    const phoneRegex = /^(\d{2,3}-?\d{3,4}-?\d{4})$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      throw new InvalidPhoneNumberFormatException();
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
