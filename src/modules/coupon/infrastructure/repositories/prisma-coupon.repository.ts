import { Injectable } from '@nestjs/common';
import {
  ICouponRepository,
  CouponListFilter,
} from '../../domain/repositories/coupon.repository.interface';
import { Coupon } from '../../domain/entities/coupon.entity';
import { PrismaService } from 'src/common/prisma';

@Injectable()
export class PrismaCouponRepository implements ICouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: bigint;
    coupon_name: string;
    coupon_code: string;
    coupon_description: string | null;
    discount_rate: any; // Decimal
    max_discount_amount: any | null; // Decimal
    min_order_amount: any; // Decimal
    issue_limit: number;
    issued_count: number;
    valid_from: Date;
    valid_until: Date;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }): Coupon {
    return Coupon.create({
      id: Number(data.id),
      couponName: data.coupon_name,
      couponCode: data.coupon_code,
      couponDescription: data.coupon_description,
      discountRate: Number(data.discount_rate),
      maxDiscountAmount: data.max_discount_amount
        ? Number(data.max_discount_amount)
        : 0,
      minOrderAmount: Number(data.min_order_amount),
      issueLimit: data.issue_limit,
      issuedCount: data.issued_count,
      validFrom: data.valid_from.toISOString(),
      validUntil: data.valid_until.toISOString(),
      isActive: data.is_active,
      createdAt: data.created_at.toISOString(),
      updatedAt: data.updated_at.toISOString(),
    });
  }

  async findById(id: number): Promise<Coupon | null> {
    const coupon = await this.prisma.coupons.findUnique({
      where: { id: BigInt(id) },
    });
    return coupon ? this.toDomain(coupon) : null;
  }

  async findByCode(couponCode: string): Promise<Coupon | null> {
    const coupon = await this.prisma.coupons.findUnique({
      where: { coupon_code: couponCode },
    });
    return coupon ? this.toDomain(coupon) : null;
  }

  async findAll(filter?: CouponListFilter): Promise<Coupon[]> {
    const where: any = {};

    if (filter?.isActive !== undefined) {
      where.is_active = filter.isActive;
    }

    if (filter?.isAvailable) {
      // 발급 가능: 활성화 + 유효 기간 내 + 발급 가능 수량
      const now = new Date();
      where.is_active = true;
      where.valid_from = { lte: now };
      where.valid_until = { gte: now };
      where.issued_count = { lt: this.prisma.coupons.fields.issue_limit };
    }

    const coupons = await this.prisma.coupons.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return coupons.map((c) => this.toDomain(c));
  }

  async save(coupon: Omit<Coupon, 'id'>): Promise<Coupon> {
    const created = await this.prisma.coupons.create({
      data: {
        coupon_name: coupon.couponName,
        coupon_code: coupon.couponCode,
        coupon_description: coupon.couponDescription,
        discount_rate: coupon.discountRate,
        max_discount_amount: coupon.maxDiscountAmount,
        min_order_amount: coupon.minOrderAmount,
        issue_limit: coupon.issueLimit,
        issued_count: coupon.issuedCount,
        valid_from: new Date(coupon.validFrom),
        valid_until: new Date(coupon.validUntil),
        is_active: coupon.isActive,
        created_at: new Date(coupon.createdAt),
        updated_at: new Date(coupon.updatedAt || coupon.createdAt),
      },
    });
    return this.toDomain(created);
  }

  async update(id: number, updates: Partial<Coupon>): Promise<Coupon> {
    const updateData: any = { updated_at: new Date() };

    if (updates.couponName !== undefined)
      updateData.coupon_name = updates.couponName;
    if (updates.couponDescription !== undefined)
      updateData.coupon_description = updates.couponDescription;
    if (updates.discountRate !== undefined)
      updateData.discount_rate = updates.discountRate;
    if (updates.maxDiscountAmount !== undefined)
      updateData.max_discount_amount = updates.maxDiscountAmount;
    if (updates.minOrderAmount !== undefined)
      updateData.min_order_amount = updates.minOrderAmount;
    if (updates.issueLimit !== undefined)
      updateData.issue_limit = updates.issueLimit;
    if (updates.validFrom !== undefined)
      updateData.valid_from = new Date(updates.validFrom);
    if (updates.validUntil !== undefined)
      updateData.valid_until = new Date(updates.validUntil);
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const updated = await this.prisma.coupons.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async incrementIssuedCount(id: number): Promise<Coupon | null> {
    try {
      // 원자적 연산: 발급 가능 수량 확인 후 증가
      const updated = await this.prisma.coupons.updateMany({
        where: {
          id: BigInt(id),
          issued_count: {
            lt: this.prisma.coupons.fields.issue_limit,
          },
        },
        data: {
          issued_count: {
            increment: 1,
          },
          updated_at: new Date(),
        },
      });

      // 업데이트된 행이 없으면 발급 실패
      if (updated.count === 0) {
        return null;
      }

      // 업데이트된 쿠폰 조회
      const coupon = await this.prisma.coupons.findUnique({
        where: { id: BigInt(id) },
      });

      return coupon ? this.toDomain(coupon) : null;
    } catch (error) {
      return null;
    }
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.coupons.count({
      where: { id: BigInt(id) },
    });
    return count > 0;
  }

  async existsByCode(couponCode: string): Promise<boolean> {
    const count = await this.prisma.coupons.count({
      where: { coupon_code: couponCode },
    });
    return count > 0;
  }
}
