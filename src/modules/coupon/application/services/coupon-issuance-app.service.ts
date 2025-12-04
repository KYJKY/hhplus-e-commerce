import { Injectable, Inject, Logger } from '@nestjs/common';
import { CouponDomainService } from '../../domain/services/coupon-domain.service';
import type { ICouponStockRepository } from '../../domain/repositories/coupon-stock.repository.interface';
import { CouponStockSyncService } from '../../infrastructure/services/coupon-stock-sync.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { DistributedLockService } from 'src/common/redis/distributed-lock.service';
import { CouponLockKeys } from 'src/common/redis';
import { UserCoupon, UserCouponStatus } from '../../domain/entities/user-coupon.entity';
import { Coupon } from '../../domain/entities/coupon.entity';
import {
  CouponAlreadyIssuedException,
  CouponIssueLimitExceededException,
  CouponServiceUnavailableException,
} from '../../domain/exceptions';

/**
 * 쿠폰 발급 Application Service
 *
 * 공통 발급 로직을 담당하여 UseCase 간 의존성 제거
 * - Redis를 활용한 고성능 쿠폰 발급 처리
 * - 분산 락 + Redis 재고 관리 + DB 영구 저장
 */
@Injectable()
export class CouponIssuanceApplicationService {
  private readonly logger = new Logger(CouponIssuanceApplicationService.name);

  constructor(
    private readonly couponDomainService: CouponDomainService,
    @Inject('ICouponStockRepository')
    private readonly couponStockRepository: ICouponStockRepository,
    private readonly couponStockSyncService: CouponStockSyncService,
    private readonly prisma: PrismaService,
    private readonly distributedLockService: DistributedLockService,
  ) {}

  /**
   * 쿠폰 발급 실행
   *
   * @param userId - 사용자 ID
   * @param couponId - 쿠폰 ID
   * @returns 발급된 UserCoupon 엔티티
   */
  async issueCoupon(userId: number, couponId: number): Promise<UserCoupon> {
    // 1. 쿠폰 기본 유효성 검증 (Domain Service - 순수 비즈니스 로직)
    const coupon =
      await this.couponDomainService.validateCouponForIssuance(couponId);

    // 2. Redis 데이터 존재 확인 (없으면 동기화)
    await this.couponStockSyncService.ensureSynced(couponId);

    // 3. 분산 락을 사용한 발급 처리 (Redis + DB 오케스트레이션)
    return await this.issueWithDistributedLock(userId, couponId, coupon);
  }

  /**
   * 분산 락을 사용한 발급 처리
   */
  private async issueWithDistributedLock(
    userId: number,
    couponId: number,
    coupon: Coupon,
  ): Promise<UserCoupon> {
    const lockKey = CouponLockKeys.issue(couponId);

    try {
      return await this.distributedLockService.executeWithLock(
        lockKey,
        async () => {
          // 1. Redis에서 발급 시도 (중복 확인 + 재고 차감)
          const result = await this.couponStockRepository.tryIssue(
            userId,
            couponId,
          );

          // 2. 결과에 따른 처리
          switch (result.status) {
            case 'ALREADY_ISSUED':
              throw new CouponAlreadyIssuedException(couponId);
            case 'OUT_OF_STOCK':
              throw new CouponIssueLimitExceededException(couponId);
            case 'COUPON_NOT_FOUND':
              // Redis 데이터 없음 - 동기화 후 재시도
              await this.couponStockSyncService.syncCoupon(coupon);
              throw new CouponServiceUnavailableException();
          }

          // 3. DB에 영구 저장
          try {
            return await this.saveToDatabase(userId, couponId);
          } catch (dbError) {
            // 4. DB 저장 실패 시 Redis 롤백
            this.logger.error(
              `DB save failed for coupon ${couponId}, user ${userId}. Rolling back Redis...`,
              dbError instanceof Error ? dbError.stack : dbError,
            );
            await this.couponStockRepository.rollbackIssuance(userId, couponId);
            throw dbError;
          }
        },
      );
    } catch (error) {
      // Redis 장애 시 에러 반환 (Fallback 없음)
      if (this.isRedisUnavailable(error)) {
        this.logger.error('Redis unavailable for coupon issuance', error);
        throw new CouponServiceUnavailableException();
      }
      throw error;
    }
  }

  /**
   * DB에 영구 저장
   */
  private async saveToDatabase(
    userId: number,
    couponId: number,
  ): Promise<UserCoupon> {
    return await this.prisma.transaction(async (tx) => {
      // 1. 발급 카운트 증가
      await tx.$executeRaw`
        UPDATE coupons
        SET issued_count = issued_count + 1, updated_at = NOW()
        WHERE id = ${BigInt(couponId)}
      `;

      // 2. 사용자 쿠폰 생성
      const userCouponRecord = await tx.user_coupons.create({
        data: {
          user_id: BigInt(userId),
          coupon_id: BigInt(couponId),
          status: 'UNUSED',
          issued_at: new Date(),
        },
      });

      // 3. 엔티티로 변환하여 반환
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
   * Redis 장애 여부 확인
   */
  private isRedisUnavailable(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('redis connection') ||
        message.includes('redis unavailable')
      );
    }
    return false;
  }
}
