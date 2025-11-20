import { Coupon } from '../entities/coupon.entity';

/**
 * 쿠폰 목록 조회 필터
 */
export interface CouponListFilter {
  isActive?: boolean;
  isAvailable?: boolean; // 발급 가능 여부 (현재 시각 기준 유효 기간 내 + 발급 가능)
}

/**
 * Coupon Repository 인터페이스
 *
 * 쿠폰 데이터 접근 계층 추상화
 */
export interface ICouponRepository {
  /**
   * ID로 쿠폰 조회
   */
  findById(id: number): Promise<Coupon | null>;

  /**
   * 쿠폰 코드로 쿠폰 조회
   */
  findByCode(couponCode: string): Promise<Coupon | null>;

  /**
   * 쿠폰 목록 조회
   */
  findAll(filter?: CouponListFilter): Promise<Coupon[]>;

  /**
   * 쿠폰 생성
   */
  save(coupon: Omit<Coupon, 'id'>): Promise<Coupon>;

  /**
   * 쿠폰 수정
   */
  update(id: number, updates: Partial<Coupon>): Promise<Coupon>;

  /**
   * 쿠폰 발급 수량 증가 (원자적 연산)
   * @returns 업데이트된 쿠폰 (발급 실패 시 null)
   */
  incrementIssuedCount(id: number): Promise<Coupon | null>;

  /**
   * 쿠폰 존재 여부 확인
   */
  exists(id: number): Promise<boolean>;

  /**
   * 쿠폰 코드 존재 여부 확인
   */
  existsByCode(couponCode: string): Promise<boolean>;
}
