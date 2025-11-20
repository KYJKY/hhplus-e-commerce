/**
 * Coupon 생성 속성
 */
export interface CreateCouponProps {
  id: number;
  couponName: string;
  couponCode: string;
  couponDescription?: string | null;
  discountRate: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  issueLimit: number;
  issuedCount?: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Coupon 수정 속성
 */
export interface UpdateCouponProps {
  couponName?: string;
  couponDescription?: string | null;
  discountRate?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  issueLimit?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

/**
 * Coupon 도메인 엔티티
 *
 * 비즈니스 규칙:
 * - 선착순 한정 수량 쿠폰 지원
 * - 사용자당 동일 쿠폰 1회만 발급 가능
 * - 할인율: 1~100%
 * - 유효 기간 검증
 */
export class Coupon {
  private constructor(
    public readonly id: number,
    public couponName: string,
    public readonly couponCode: string,
    public couponDescription: string | null,
    public discountRate: number,
    public maxDiscountAmount: number,
    public minOrderAmount: number,
    public issueLimit: number,
    private _issuedCount: number,
    public validFrom: string,
    public validUntil: string,
    public isActive: boolean,
    public readonly createdAt: string,
    private _updatedAt: string | null,
  ) {}

  /**
   * 발급 수량 반환
   */
  get issuedCount(): number {
    return this._issuedCount;
  }

  /**
   * 수정 시각 반환
   */
  get updatedAt(): string | null {
    return this._updatedAt;
  }

  /**
   * Coupon 엔티티 생성 팩토리 메서드
   */
  static create(props: CreateCouponProps): Coupon {
    // 검증
    this.validateCouponName(props.couponName);
    this.validateCouponCode(props.couponCode);
    this.validateDiscountRate(props.discountRate);
    this.validateAmounts(props.maxDiscountAmount, props.minOrderAmount);
    this.validateIssueLimit(props.issueLimit);
    this.validateValidPeriod(props.validFrom, props.validUntil);

    return new Coupon(
      props.id,
      props.couponName,
      props.couponCode,
      props.couponDescription ?? null,
      props.discountRate,
      props.maxDiscountAmount,
      props.minOrderAmount,
      props.issueLimit,
      props.issuedCount ?? 0,
      props.validFrom,
      props.validUntil,
      props.isActive ?? true,
      props.createdAt,
      props.updatedAt ?? null,
    );
  }

  /**
   * 쿠폰 정보 수정
   */
  update(props: UpdateCouponProps): void {
    if (props.couponName !== undefined) {
      Coupon.validateCouponName(props.couponName);
      this.couponName = props.couponName;
    }

    if (props.couponDescription !== undefined) {
      this.couponDescription = props.couponDescription;
    }

    if (props.discountRate !== undefined) {
      Coupon.validateDiscountRate(props.discountRate);
      this.discountRate = props.discountRate;
    }

    if (props.maxDiscountAmount !== undefined) {
      this.maxDiscountAmount = props.maxDiscountAmount;
    }

    if (props.minOrderAmount !== undefined) {
      this.minOrderAmount = props.minOrderAmount;
    }

    if (
      props.maxDiscountAmount !== undefined ||
      props.minOrderAmount !== undefined
    ) {
      Coupon.validateAmounts(this.maxDiscountAmount, this.minOrderAmount);
    }

    if (props.issueLimit !== undefined) {
      Coupon.validateIssueLimit(props.issueLimit);
      this.issueLimit = props.issueLimit;
    }

    if (props.validFrom !== undefined) {
      this.validFrom = props.validFrom;
    }

    if (props.validUntil !== undefined) {
      this.validUntil = props.validUntil;
    }

    if (props.validFrom !== undefined || props.validUntil !== undefined) {
      Coupon.validateValidPeriod(this.validFrom, this.validUntil);
    }

    if (props.isActive !== undefined) {
      this.isActive = props.isActive;
    }

    this._updatedAt = new Date().toISOString();
  }

  /**
   * 쿠폰 발급 (발급 수량 증가)
   */
  issue(): void {
    if (!this.canIssue()) {
      throw new Error('Coupon issue limit exceeded');
    }

    this._issuedCount += 1;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * 발급 가능 여부 확인
   */
  canIssue(): boolean {
    return this._issuedCount < this.issueLimit && this.isActive;
  }

  /**
   * 남은 발급 수량 반환
   */
  getRemainingCount(): number {
    return Math.max(0, this.issueLimit - this._issuedCount);
  }

  /**
   * 유효 기간 내 여부 확인
   * @param currentDate - 확인할 시각 (기본값: 현재 시각)
   */
  isValidPeriod(currentDate: Date = new Date()): boolean {
    const current = currentDate.getTime();
    const from = new Date(this.validFrom).getTime();
    const until = new Date(this.validUntil).getTime();

    return current >= from && current <= until;
  }

  /**
   * 유효 기간 시작 여부 확인
   */
  hasStarted(currentDate: Date = new Date()): boolean {
    return currentDate.getTime() >= new Date(this.validFrom).getTime();
  }

  /**
   * 유효 기간 만료 여부 확인
   */
  isExpired(currentDate: Date = new Date()): boolean {
    return currentDate.getTime() > new Date(this.validUntil).getTime();
  }

  /**
   * 할인 금액 계산
   * @param orderAmount - 주문 금액
   */
  calculateDiscountAmount(orderAmount: number): number {
    const discountAmount = Math.floor(orderAmount * (this.discountRate / 100));
    return Math.min(discountAmount, this.maxDiscountAmount);
  }

  /**
   * 최소 주문 금액 충족 여부 확인
   * @param orderAmount - 주문 금액
   */
  meetsMinOrderAmount(orderAmount: number): boolean {
    return orderAmount >= this.minOrderAmount;
  }

  /**
   * 쿠폰 비활성화
   */
  deactivate(): void {
    this.isActive = false;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * 쿠폰 활성화
   */
  activate(): void {
    this.isActive = true;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * 쿠폰명 검증 (1~100자)
   */
  private static validateCouponName(couponName: string): void {
    if (
      !couponName ||
      couponName.trim().length < 1 ||
      couponName.trim().length > 100
    ) {
      throw new Error('Coupon name must be between 1 and 100 characters');
    }
  }

  /**
   * 쿠폰 코드 검증 (1~50자, 영문 대문자와 숫자만 허용)
   */
  private static validateCouponCode(couponCode: string): void {
    if (!couponCode || couponCode.length < 1 || couponCode.length > 50) {
      throw new Error('Coupon code must be between 1 and 50 characters');
    }

    // 영문 대문자와 숫자만 허용
    const codePattern = /^[A-Z0-9]+$/;
    if (!codePattern.test(couponCode)) {
      throw new Error(
        'Coupon code must contain only uppercase letters and numbers',
      );
    }
  }

  /**
   * 할인율 검증 (1~100)
   */
  private static validateDiscountRate(discountRate: number): void {
    if (discountRate < 1 || discountRate > 100) {
      throw new Error('Discount rate must be between 1 and 100');
    }
  }

  /**
   * 금액 검증
   */
  private static validateAmounts(
    maxDiscountAmount: number,
    minOrderAmount: number,
  ): void {
    if (maxDiscountAmount < 0) {
      throw new Error('Max discount amount must be greater than or equal to 0');
    }

    if (minOrderAmount < 0) {
      throw new Error('Min order amount must be greater than or equal to 0');
    }
  }

  /**
   * 발급 한도 검증
   */
  private static validateIssueLimit(issueLimit: number): void {
    if (issueLimit < 1) {
      throw new Error('Issue limit must be greater than 0');
    }
  }

  /**
   * 유효 기간 검증
   */
  private static validateValidPeriod(
    validFrom: string,
    validUntil: string,
  ): void {
    const from = new Date(validFrom);
    const until = new Date(validUntil);

    if (isNaN(from.getTime())) {
      throw new Error('Invalid validFrom date');
    }

    if (isNaN(until.getTime())) {
      throw new Error('Invalid validUntil date');
    }

    if (from.getTime() >= until.getTime()) {
      throw new Error('validFrom must be earlier than validUntil');
    }
  }
}
