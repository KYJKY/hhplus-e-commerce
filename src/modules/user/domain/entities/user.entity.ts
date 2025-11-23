import { Email } from '../value-objects/email.vo';
import { Name } from '../value-objects/name.vo';
import { DisplayName } from '../value-objects/display-name.vo';
import { PhoneNumber } from '../../../../common/domain/value-objects/phone-number.vo';
import { Point } from '../../../payment/domain/value-objects/point.vo';

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
 * User 도메인 엔티티 (VO 적용)
 *
 * Value Object 사용:
 * - Email: 이메일 검증 및 불변성 보장
 * - Name: 이름 검증 (2~50자)
 * - DisplayName: 닉네임 검증 (2~20자)
 * - PhoneNumber: 전화번호 검증
 * - Point: 포인트 비즈니스 규칙 적용
 */
export class User {
  private constructor(
    public readonly id: number,
    public readonly loginId: string,
    private loginPassword: string,
    private readonly _email: Email,
    private _name: Name,
    private _displayName: DisplayName | null,
    private _phoneNumber: PhoneNumber | null,
    private _point: Point,
    public lastLoginAt: string | null,
    public deletedAt: string | null,
    public readonly createdAt: string,
    public updatedAt: string | null,
  ) {}

  // ===== Getter 메서드 (기존 코드 호환성 유지) =====

  /**
   * 이메일 문자열 반환 (기존 코드 호환)
   */
  get email(): string {
    return this._email.getValue();
  }

  /**
   * 이름 문자열 반환 (기존 코드 호환)
   */
  get name(): string {
    return this._name.getValue();
  }

  /**
   * 닉네임 문자열 반환 (기존 코드 호환)
   */
  get displayName(): string | null {
    return this._displayName?.getValue() ?? null;
  }

  /**
   * 전화번호 문자열 반환 (기존 코드 호환)
   */
  get phoneNumber(): string | null {
    return this._phoneNumber?.getValue() ?? null;
  }

  // ===== VO Getter 메서드 (새로운 코드에서 사용) =====

  /**
   * Email VO 반환
   */
  getEmailVO(): Email {
    return this._email;
  }

  /**
   * Name VO 반환
   */
  getNameVO(): Name {
    return this._name;
  }

  /**
   * DisplayName VO 반환
   */
  getDisplayNameVO(): DisplayName | null {
    return this._displayName;
  }

  /**
   * PhoneNumber VO 반환
   */
  getPhoneNumberVO(): PhoneNumber | null {
    return this._phoneNumber;
  }

  /**
   * Point VO 반환
   */
  getPointVO(): Point {
    return this._point;
  }

  /**
   * User 엔티티 생성 팩토리 메서드
   * VO를 생성하여 검증을 VO에 위임
   */
  static create(props: CreateUserProps): User {
    // VO 생성 (검증은 VO 내부에서 수행)
    const email = Email.create(props.email);
    const name = Name.create(props.name);
    const displayName = props.displayName
      ? DisplayName.create(props.displayName)
      : null;
    const phoneNumber = props.phoneNumber
      ? PhoneNumber.create(props.phoneNumber)
      : null;
    const point = Point.create(props.point ?? 0);

    return new User(
      props.id,
      props.loginId,
      props.loginPassword,
      email,
      name,
      displayName,
      phoneNumber,
      point,
      props.lastLoginAt ?? null,
      props.deletedAt ?? null,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  /**
   * 프로필 수정
   * VO를 사용하여 검증
   */
  updateProfile(props: UpdateUserProfileProps): void {
    if (props.name !== undefined) {
      this._name = Name.create(props.name);
    }

    if (props.displayName !== undefined) {
      this._displayName = props.displayName
        ? DisplayName.create(props.displayName)
        : null;
    }

    if (props.phoneNumber !== undefined) {
      this._phoneNumber = props.phoneNumber
        ? PhoneNumber.create(props.phoneNumber)
        : null;
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * 포인트 조회
   */
  getPoint(): number {
    return this._point.getValue();
  }

  /**
   * 포인트 충전
   * @param amount - 충전할 포인트
   */
  chargePoint(amount: number): void {
    this._point = this._point.charge(amount);
  }

  /**
   * 포인트 차감
   * @param amount - 차감할 포인트
   */
  deductPoint(amount: number): void {
    this._point = this._point.use(amount);
  }

  /**
   * 결제 잔액 검증
   * Point VO에 검증 책임 위임 (Tell, Don't Ask)
   * @param requiredAmount - 필요한 금액
   * @throws InsufficientBalanceException 잔액 부족 시 (Payment 도메인 예외)
   */
  validateBalance(requiredAmount: number): void {
    this._point.validateSufficiency(requiredAmount);
  }
}
