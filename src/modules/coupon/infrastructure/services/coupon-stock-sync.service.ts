import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ICouponRepository } from '../../domain/repositories/coupon.repository.interface';
import type { IUserCouponRepository } from '../../domain/repositories/user-coupon.repository.interface';
import type { ICouponStockRepository } from '../../domain/repositories/coupon-stock.repository.interface';
import { Coupon } from '../../domain/entities/coupon.entity';
import { RedisTTL } from 'src/common/redis';

/**
 * 쿠폰 재고 동기화 서비스
 *
 * 애플리케이션 시작 시 DB -> Redis 동기화
 * Redis 장애 복구 시 재동기화
 */
@Injectable()
export class CouponStockSyncService implements OnModuleInit {
  private readonly logger = new Logger(CouponStockSyncService.name);

  constructor(
    @Inject('ICouponRepository')
    private readonly couponRepository: ICouponRepository,
    @Inject('IUserCouponRepository')
    private readonly userCouponRepository: IUserCouponRepository,
    @Inject('ICouponStockRepository')
    private readonly couponStockRepository: ICouponStockRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Starting coupon stock synchronization...');
    await this.syncAllActiveCoupons();
    this.logger.log('Coupon stock synchronization completed');
  }

  /**
   * 모든 활성 쿠폰 동기화
   */
  async syncAllActiveCoupons(): Promise<void> {
    try {
      const activeCoupons = await this.couponRepository.findAll({
        isActive: true,
      });

      this.logger.log(`Found ${activeCoupons.length} active coupons to sync`);

      for (const coupon of activeCoupons) {
        try {
          await this.syncCoupon(coupon);
        } catch (error) {
          this.logger.error(
            `Failed to sync coupon ${coupon.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync active coupons: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 단일 쿠폰 동기화
   */
  async syncCoupon(coupon: Coupon): Promise<void> {
    const ttl = this.calculateTTL(coupon.validUntil);

    // 1. 재고 동기화
    const remainingStock = coupon.getRemainingCount();
    await this.couponStockRepository.syncStock(coupon.id, remainingStock, ttl);

    // 2. 발급 사용자 목록 동기화
    const issuedUserIds = await this.userCouponRepository.getUserIdsByCoupon(
      coupon.id,
    );
    await this.couponStockRepository.syncIssuedUsers(
      coupon.id,
      issuedUserIds,
      ttl,
    );

    // 3. 메타데이터 캐싱
    await this.couponStockRepository.cacheMetadata(
      coupon.id,
      {
        isActive: coupon.isActive,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        issueLimit: coupon.issueLimit,
      },
      RedisTTL.COUPON.META,
    );

    this.logger.debug(
      `Synced coupon ${coupon.id}: stock=${remainingStock}, users=${issuedUserIds.length}`,
    );
  }

  /**
   * 쿠폰 ID로 동기화 (필요 시 호출)
   */
  async syncCouponById(couponId: number): Promise<void> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      this.logger.warn(`Coupon ${couponId} not found for sync`);
      return;
    }

    await this.syncCoupon(coupon);
  }

  /**
   * Redis 데이터 존재 여부 확인 후 필요시 동기화
   */
  async ensureSynced(couponId: number): Promise<boolean> {
    const exists = await this.couponStockRepository.exists(couponId);
    if (!exists) {
      this.logger.warn(
        `Coupon ${couponId} not found in Redis, syncing from DB...`,
      );
      await this.syncCouponById(couponId);
      return false;
    }
    return true;
  }

  /**
   * TTL 계산 (유효기간 종료일 기준)
   */
  private calculateTTL(validUntil: string): number {
    const now = new Date();
    const endDate = new Date(validUntil);
    const diffMs = endDate.getTime() - now.getTime();

    // 이미 만료된 경우 기본 TTL 사용
    if (diffMs <= 0) {
      return RedisTTL.COUPON.STOCK_DATA;
    }

    // 1일 버퍼 추가 (초 단위)
    const ttlSeconds = Math.ceil(diffMs / 1000) + 24 * 60 * 60;

    // 최대 TTL 제한 (7일)
    return Math.min(ttlSeconds, RedisTTL.COUPON.STOCK_DATA);
  }
}
