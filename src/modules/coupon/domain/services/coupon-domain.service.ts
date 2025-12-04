import { Inject, Injectable } from '@nestjs/common';
import { Coupon } from '../entities/coupon.entity';
import { UserCoupon, UserCouponStatus } from '../entities/user-coupon.entity';
import type { ICouponRepository } from '../repositories/coupon.repository.interface';
import type { IUserCouponRepository } from '../repositories/user-coupon.repository.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { DistributedLockService } from 'src/common/redis/distributed-lock.service';
import { CouponLockKeys } from 'src/common/redis';
import {
  CouponNotFoundException,
  UserCouponNotFoundException,
  CouponAccessDeniedException,
  CouponNotActiveException,
  CouponAlreadyIssuedException,
  CouponIssueLimitExceededException,
  CouponNotStartedException,
  CouponExpiredException,
  CouponAlreadyUsedException,
  InvalidCouponCodeException,
} from '../exceptions';

/**
 * 쿠폰 유효성 검증 결과
 */
export interface CouponValidationResult {
  isValid: boolean;
  discountAmount: number;
  errors: string[];
}

/**
 * Coupon Domain Service
 *
 * Domain Layer의 비즈니스 로직을 담당
 * - Repository와 직접 상호작용
 * - 도메인 규칙 강제
 * - Use Case에서 호출됨
 */
@Injectable()
export class CouponDomainService {
  constructor(
    @Inject('ICouponRepository')
    private readonly couponRepository: ICouponRepository,
    @Inject('IUserCouponRepository')
    private readonly userCouponRepository: IUserCouponRepository,
    private readonly prisma: PrismaService,
    private readonly distributedLockService: DistributedLockService,
  ) {}

  /**
   * 쿠폰 조회 (존재 확인 포함)
   */
  async findCouponById(couponId: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new CouponNotFoundException(couponId);
    }
    return coupon;
  }

  /**
   * 쿠폰 코드로 조회 (존재 확인 포함)
   */
  async findCouponByCode(couponCode: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findByCode(couponCode);
    if (!coupon) {
      throw new InvalidCouponCodeException(couponCode);
    }
    return coupon;
  }

  /**
   * 발급 가능한 쿠폰 목록 조회
   */
  async findAvailableCoupons(): Promise<Coupon[]> {
    return await this.couponRepository.findAll({ isAvailable: true });
  }

  /**
   * 활성화된 쿠폰 목록 조회
   */
  async findActiveCoupons(): Promise<Coupon[]> {
    return await this.couponRepository.findAll({ isActive: true });
  }

  /**
   * 사용자 쿠폰 조회 (존재 확인 포함)
   */
  async findUserCouponById(userCouponId: number): Promise<UserCoupon> {
    const userCoupon = await this.userCouponRepository.findById(userCouponId);
    if (!userCoupon) {
      throw new UserCouponNotFoundException(userCouponId);
    }
    return userCoupon;
  }

  /**
   * 사용자 쿠폰 조회 (권한 확인 포함)
   */
  async findUserCouponWithAuthorization(
    userId: number,
    userCouponId: number,
  ): Promise<UserCoupon> {
    const userCoupon = await this.findUserCouponById(userCouponId);

    if (!userCoupon.isOwnedBy(userId)) {
      throw new CouponAccessDeniedException(userCouponId);
    }

    return userCoupon;
  }

  /**
   * 사용자의 쿠폰 목록 조회
   */
  async findUserCouponsByUserId(
    userId: number,
    status?: UserCouponStatus,
  ): Promise<UserCoupon[]> {
    return await this.userCouponRepository.findByUserId(userId, status);
  }

  /**
   * 쿠폰 발급 (비즈니스 규칙 검증 포함)
   * 트랜잭션을 통해 초과 발급 방지 및 데이터 정합성 보장
   *
   * Redis 분산 락을 사용하여 다중 서버 환경에서 동시성 제어
   */
  async issueCoupon(userId: number, couponId: number): Promise<UserCoupon> {
    // 1. 쿠폰 조회
    const coupon = await this.findCouponById(couponId);

    // 2. 쿠폰 활성화 여부 확인
    if (!coupon.isActive) {
      throw new CouponNotActiveException(couponId);
    }

    // 3. 유효 기간 확인
    const currentDate = new Date();
    if (!coupon.hasStarted(currentDate)) {
      throw new CouponNotStartedException(coupon.validFrom);
    }
    if (coupon.isExpired(currentDate)) {
      throw new CouponExpiredException(coupon.validUntil);
    }

    // 4. 중복 발급 확인 (사용자별 1회 발급)
    const existingUserCoupon =
      await this.userCouponRepository.findByUserAndCoupon(userId, couponId);
    if (existingUserCoupon) {
      throw new CouponAlreadyIssuedException(couponId);
    }

    // 5. 발급 가능 여부 확인 (선착순 한정 수량)
    if (!coupon.canIssue()) {
      throw new CouponIssueLimitExceededException(couponId);
    }

    // 6. 분산 락을 사용한 쿠폰 발급
    return await this.issueCouponWithDistributedLock(userId, couponId);
  }

  /**
   * 분산 락을 사용한 쿠폰 발급
   */
  private async issueCouponWithDistributedLock(
    userId: number,
    couponId: number,
  ): Promise<UserCoupon> {
    const lockKey = CouponLockKeys.issue(couponId);

    return await this.distributedLockService.executeWithLock(
      lockKey,
      async () => {
        return await this.prisma.transaction(async (tx) => {
          // 1. 쿠폰 조회 (FOR UPDATE 제거)
          const [couponRow] = await tx.$queryRaw<
            Array<{ id: bigint; issued_count: number; issue_limit: number }>
          >`
            SELECT id, issued_count, issue_limit
            FROM coupons
            WHERE id = ${BigInt(couponId)}
          `;

          if (!couponRow) {
            throw new CouponNotFoundException(couponId);
          }

          // 2. 발급 한도 체크
          if (couponRow.issued_count >= couponRow.issue_limit) {
            throw new CouponIssueLimitExceededException(couponId);
          }

          // 3. 발급 카운트 증가
          await tx.$executeRaw`
            UPDATE coupons
            SET issued_count = issued_count + 1, updated_at = NOW()
            WHERE id = ${BigInt(couponId)}
          `;

          // 4. 사용자 쿠폰 생성
          const userCouponRecord = await tx.user_coupons.create({
            data: {
              user_id: BigInt(userId),
              coupon_id: BigInt(couponId),
              status: 'UNUSED',
              issued_at: new Date(),
            },
          });

          // 엔티티로 변환하여 반환
          return UserCoupon.create({
            id: Number(userCouponRecord.id),
            userId,
            couponId,
            status: UserCouponStatus.UNUSED,
            issuedAt: userCouponRecord.issued_at.toISOString(),
          });
        });
      },
    );
  }

  /**
   * 비관적 락을 사용한 쿠폰 발급 (기존 방식)
   */
  private async issueCouponWithPessimisticLock(
    userId: number,
    couponId: number,
  ): Promise<UserCoupon> {
    return await this.prisma.transaction(async (tx) => {
      // 1. SELECT ... FOR UPDATE: 비관락으로 쿠폰 행 잠금
      const [couponRow] = await tx.$queryRaw<
        Array<{ id: bigint; issued_count: number; issue_limit: number }>
      >`
        SELECT id, issued_count, issue_limit
        FROM coupons
        WHERE id = ${BigInt(couponId)}
        FOR UPDATE
      `;

      if (!couponRow) {
        throw new CouponNotFoundException(couponId);
      }

      // 2. 발급 한도 체크
      if (couponRow.issued_count >= couponRow.issue_limit) {
        throw new CouponIssueLimitExceededException(couponId);
      }

      // 3. 발급 카운트 증가
      await tx.$executeRaw`
        UPDATE coupons
        SET issued_count = issued_count + 1, updated_at = NOW()
        WHERE id = ${BigInt(couponId)}
      `;

      // 4. 사용자 쿠폰 생성
      const userCouponRecord = await tx.user_coupons.create({
        data: {
          user_id: BigInt(userId),
          coupon_id: BigInt(couponId),
          status: 'UNUSED',
          issued_at: new Date(),
        },
      });

      // 엔티티로 변환하여 반환
      return UserCoupon.create({
        id: Number(userCouponRecord.id),
        userId,
        couponId,
        status: UserCouponStatus.UNUSED,
        issuedAt: userCouponRecord.issued_at.toISOString(),
      });
    });
  }

  /**
   * 쿠폰 유효성 검증 (주문 시 사용)
   * @param userId - 사용자 ID
   * @param userCouponId - 사용자 쿠폰 ID
   * @param orderAmount - 주문 금액
   */
  async validateCoupon(
    userId: number,
    userCouponId: number,
    orderAmount: number,
  ): Promise<CouponValidationResult> {
    const errors: string[] = [];
    let discountAmount = 0;

    try {
      // 1. 사용자 쿠폰 조회 및 권한 확인
      const userCoupon = await this.findUserCouponWithAuthorization(
        userId,
        userCouponId,
      );

      // 2. 쿠폰 상태 확인 (UNUSED만 사용 가능)
      if (!userCoupon.canUse()) {
        if (userCoupon.isUsed()) {
          errors.push('Coupon has already been used');
        } else if (userCoupon.isExpired()) {
          errors.push('Coupon has expired');
        }
      }

      // 3. 원본 쿠폰 조회
      const coupon = await this.findCouponById(userCoupon.couponId);

      // 4. 유효 기간 확인
      const currentDate = new Date();
      if (!coupon.isValidPeriod(currentDate)) {
        if (!coupon.hasStarted(currentDate)) {
          errors.push(`Coupon validity period has not started yet`);
        } else if (coupon.isExpired(currentDate)) {
          errors.push(`Coupon has expired`);
        }
      }

      // 5. 최소 주문 금액 확인
      if (!coupon.meetsMinOrderAmount(orderAmount)) {
        errors.push(
          `Minimum order amount not met. Required: ${coupon.minOrderAmount}, Current: ${orderAmount}`,
        );
      }

      // 6. 할인 금액 계산
      if (errors.length === 0) {
        discountAmount = coupon.calculateDiscountAmount(orderAmount);
      }

      return {
        isValid: errors.length === 0,
        discountAmount,
        errors,
      };
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
      return {
        isValid: false,
        discountAmount: 0,
        errors,
      };
    }
  }

  /**
   * 쿠폰 사용 처리 (결제 완료 시)
   */
  async useCoupon(
    userId: number,
    userCouponId: number,
    orderId: number,
  ): Promise<UserCoupon> {
    // 1. 사용자 쿠폰 조회 및 권한 확인
    const userCoupon = await this.findUserCouponWithAuthorization(
      userId,
      userCouponId,
    );

    // 2. 사용 가능 상태 확인
    if (!userCoupon.canUse()) {
      throw new CouponAlreadyUsedException(userCouponId);
    }

    // 3. 쿠폰 사용 처리 (엔티티 메서드)
    userCoupon.use(orderId);

    // 4. Repository를 통해 업데이트
    return await this.userCouponRepository.update(userCouponId, userCoupon);
  }

  /**
   * 쿠폰 복원 (주문 취소 시)
   * 1차 범위 제외이지만 인터페이스 제공
   */
  async restoreCoupon(
    userId: number,
    userCouponId: number,
  ): Promise<UserCoupon> {
    // 1. 사용자 쿠폰 조회 및 권한 확인
    const userCoupon = await this.findUserCouponWithAuthorization(
      userId,
      userCouponId,
    );

    // 2. 복원 (엔티티 메서드)
    userCoupon.restore();

    // 3. Repository를 통해 업데이트
    return await this.userCouponRepository.update(userCouponId, userCoupon);
  }

  /**
   * 쿠폰 통계 조회
   */
  async getCouponStatistics(couponId: number): Promise<{
    coupon: Coupon;
    statistics: {
      issuedCount: number;
      usedCount: number;
      expiredCount: number;
      unusedCount: number;
      usageRate: number;
    };
  }> {
    // 1. 쿠폰 조회
    const coupon = await this.findCouponById(couponId);

    // 2. 통계 조회
    const stats =
      await this.userCouponRepository.getStatisticsByCoupon(couponId);

    // 3. 사용률 계산
    const usageRate =
      stats.issuedCount > 0
        ? Math.round((stats.usedCount / stats.issuedCount) * 100 * 100) / 100
        : 0;

    return {
      coupon,
      statistics: {
        ...stats,
        usageRate,
      },
    };
  }

  /**
   * 만료된 쿠폰 일괄 처리 (배치용)
   */
  async expireOldCoupons(): Promise<number> {
    const currentDate = new Date();
    return await this.userCouponRepository.expireOldCoupons(currentDate);
  }
}
