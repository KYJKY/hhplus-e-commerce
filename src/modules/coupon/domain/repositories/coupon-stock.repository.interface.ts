/**
 * 쿠폰 발급 결과 상태
 */
export type CouponIssuanceStatus =
  | 'SUCCESS'
  | 'ALREADY_ISSUED'
  | 'OUT_OF_STOCK'
  | 'COUPON_NOT_FOUND';

/**
 * 쿠폰 발급 시도 결과
 */
export interface CouponIssuanceResult {
  status: CouponIssuanceStatus;
  remainingStock?: number;
}

/**
 * 쿠폰 메타데이터 (Redis Hash 저장용)
 */
export interface CouponMetadata {
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  issueLimit: number;
}

/**
 * 쿠폰 재고 Repository 인터페이스
 *
 * Redis를 사용한 쿠폰 재고 및 발급 관리
 * - 발급 가능 여부 판단
 * - 재고 차감
 * - 중복 발급 확인
 */
export interface ICouponStockRepository {
  /**
   * 쿠폰 발급 시도
   * 분산 락 내에서 호출됨 - 중복 발급 확인, 재고 차감, 발급 사용자 등록
   *
   * @param userId - 사용자 ID
   * @param couponId - 쿠폰 ID
   * @returns 발급 결과
   */
  tryIssue(userId: number, couponId: number): Promise<CouponIssuanceResult>;

  /**
   * 발급 롤백 (DB 저장 실패 시)
   * 재고 복구 및 발급 사용자 제거
   *
   * @param userId - 사용자 ID
   * @param couponId - 쿠폰 ID
   */
  rollbackIssuance(userId: number, couponId: number): Promise<void>;

  /**
   * 재고 동기화 (DB -> Redis)
   *
   * @param couponId - 쿠폰 ID
   * @param remainingStock - 남은 재고 수량
   * @param ttlSeconds - TTL (초), 선택적
   */
  syncStock(
    couponId: number,
    remainingStock: number,
    ttlSeconds?: number,
  ): Promise<void>;

  /**
   * 발급 사용자 동기화 (DB -> Redis)
   *
   * @param couponId - 쿠폰 ID
   * @param userIds - 발급받은 사용자 ID 목록
   * @param ttlSeconds - TTL (초), 선택적
   */
  syncIssuedUsers(
    couponId: number,
    userIds: number[],
    ttlSeconds?: number,
  ): Promise<void>;

  /**
   * 쿠폰 메타데이터 캐싱
   *
   * @param couponId - 쿠폰 ID
   * @param metadata - 메타데이터
   * @param ttlSeconds - TTL (초), 선택적
   */
  cacheMetadata(
    couponId: number,
    metadata: CouponMetadata,
    ttlSeconds?: number,
  ): Promise<void>;

  /**
   * 쿠폰 메타데이터 조회
   *
   * @param couponId - 쿠폰 ID
   * @returns 메타데이터 또는 null
   */
  getMetadata(couponId: number): Promise<CouponMetadata | null>;

  /**
   * 남은 재고 조회
   *
   * @param couponId - 쿠폰 ID
   * @returns 남은 재고 또는 null (데이터 없음)
   */
  getRemainingStock(couponId: number): Promise<number | null>;

  /**
   * 사용자 발급 여부 확인
   *
   * @param userId - 사용자 ID
   * @param couponId - 쿠폰 ID
   * @returns 발급 여부
   */
  hasUserIssued(userId: number, couponId: number): Promise<boolean>;

  /**
   * 쿠폰 데이터 삭제 (쿠폰 만료/비활성화 시)
   *
   * @param couponId - 쿠폰 ID
   */
  removeCouponData(couponId: number): Promise<void>;

  /**
   * 쿠폰 데이터 존재 여부 확인
   *
   * @param couponId - 쿠폰 ID
   * @returns 데이터 존재 여부
   */
  exists(couponId: number): Promise<boolean>;
}
