import { Injectable } from '@nestjs/common';
import {
  IUserCouponRepository,
  UserCouponListFilter,
} from '../../domain/repositories/user-coupon.repository.interface';
import {
  UserCoupon,
  UserCouponStatus,
} from '../../domain/entities/user-coupon.entity';
import { PrismaService } from 'src/common/prisma';

@Injectable()
export class PrismaUserCouponRepository implements IUserCouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: bigint;
    user_id: bigint;
    coupon_id: bigint;
    status: string;
    issued_at: Date;
    used_at: Date | null;
    used_order_id: bigint | null;
  }): UserCoupon {
    return UserCoupon.create({
      id: Number(data.id),
      userId: Number(data.user_id),
      couponId: Number(data.coupon_id),
      status: data.status as UserCouponStatus,
      issuedAt: data.issued_at.toISOString(),
      usedAt: data.used_at?.toISOString() ?? null,
      usedOrderId: data.used_order_id ? Number(data.used_order_id) : null,
    });
  }

  async findById(id: number): Promise<UserCoupon | null> {
    const userCoupon = await this.prisma.user_coupons.findUnique({
      where: { id: BigInt(id) },
    });
    return userCoupon ? this.toDomain(userCoupon) : null;
  }

  async findByUserId(
    userId: number,
    status?: UserCouponStatus,
  ): Promise<UserCoupon[]> {
    const where: any = { user_id: BigInt(userId) };
    if (status) {
      where.status = status;
    }

    const userCoupons = await this.prisma.user_coupons.findMany({
      where,
      orderBy: { issued_at: 'desc' },
    });

    return userCoupons.map((uc) => this.toDomain(uc));
  }

  async findByUserAndCoupon(
    userId: number,
    couponId: number,
  ): Promise<UserCoupon | null> {
    const userCoupon = await this.prisma.user_coupons.findUnique({
      where: {
        user_id_coupon_id: {
          user_id: BigInt(userId),
          coupon_id: BigInt(couponId),
        },
      },
    });
    return userCoupon ? this.toDomain(userCoupon) : null;
  }

  async findByIds(ids: number[]): Promise<UserCoupon[]> {
    const userCoupons = await this.prisma.user_coupons.findMany({
      where: {
        id: { in: ids.map((id) => BigInt(id)) },
      },
    });
    return userCoupons.map((uc) => this.toDomain(uc));
  }

  async findAll(filter: UserCouponListFilter): Promise<UserCoupon[]> {
    const where: any = {};

    if (filter.userId) {
      where.user_id = BigInt(filter.userId);
    }
    if (filter.couponId) {
      where.coupon_id = BigInt(filter.couponId);
    }
    if (filter.status) {
      where.status = filter.status;
    }

    const userCoupons = await this.prisma.user_coupons.findMany({
      where,
      orderBy: { issued_at: 'desc' },
    });

    return userCoupons.map((uc) => this.toDomain(uc));
  }

  async save(userCoupon: Omit<UserCoupon, 'id'>): Promise<UserCoupon> {
    const created = await this.prisma.user_coupons.create({
      data: {
        user_id: BigInt(userCoupon.userId),
        coupon_id: BigInt(userCoupon.couponId),
        status: userCoupon.status,
        issued_at: new Date(userCoupon.issuedAt),
        used_at: userCoupon.usedAt ? new Date(userCoupon.usedAt) : null,
        used_order_id: userCoupon.usedOrderId
          ? BigInt(userCoupon.usedOrderId)
          : null,
      },
    });
    return this.toDomain(created);
  }

  async update(id: number, updates: Partial<UserCoupon>): Promise<UserCoupon> {
    const updateData: any = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.usedAt !== undefined)
      updateData.used_at = updates.usedAt ? new Date(updates.usedAt) : null;
    if (updates.usedOrderId !== undefined)
      updateData.used_order_id = updates.usedOrderId
        ? BigInt(updates.usedOrderId)
        : null;

    const updated = await this.prisma.user_coupons.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async existsByUserAndCoupon(
    userId: number,
    couponId: number,
  ): Promise<boolean> {
    const count = await this.prisma.user_coupons.count({
      where: {
        user_id: BigInt(userId),
        coupon_id: BigInt(couponId),
      },
    });
    return count > 0;
  }

  async getStatisticsByCoupon(couponId: number): Promise<{
    issuedCount: number;
    usedCount: number;
    expiredCount: number;
    unusedCount: number;
  }> {
    const [issued, used, expired, unused] = await Promise.all([
      this.prisma.user_coupons.count({
        where: { coupon_id: BigInt(couponId) },
      }),
      this.prisma.user_coupons.count({
        where: { coupon_id: BigInt(couponId), status: UserCouponStatus.USED },
      }),
      this.prisma.user_coupons.count({
        where: {
          coupon_id: BigInt(couponId),
          status: UserCouponStatus.EXPIRED,
        },
      }),
      this.prisma.user_coupons.count({
        where: {
          coupon_id: BigInt(couponId),
          status: UserCouponStatus.UNUSED,
        },
      }),
    ]);

    return {
      issuedCount: issued,
      usedCount: used,
      expiredCount: expired,
      unusedCount: unused,
    };
  }

  async expireOldCoupons(currentDate: Date): Promise<number> {
    // 유효 기간이 지난 UNUSED 쿠폰을 EXPIRED로 변경
    const result = await this.prisma.user_coupons.updateMany({
      where: {
        status: UserCouponStatus.UNUSED,
        coupons: {
          valid_until: {
            lt: currentDate,
          },
        },
      },
      data: {
        status: UserCouponStatus.EXPIRED,
      },
    });

    return result.count;
  }
}
