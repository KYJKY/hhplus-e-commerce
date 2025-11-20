import { Module } from '@nestjs/common';
import { CouponController } from './presentation/coupon.controller';
import {
  PrismaCouponRepository,
  PrismaUserCouponRepository,
} from './infrastructure/repositories';

// Domain Services
import { CouponDomainService } from './domain/services/coupon-domain.service';

// Use Cases
import {
  GetAvailableCouponsUseCase,
  GetUserCouponsUseCase,
  GetCouponDetailUseCase,
  IssueCouponUseCase,
  IssueCouponByCodeUseCase,
  ValidateCouponUseCase,
  UseCouponUseCase,
  GetCouponStatisticsUseCase,
} from './application/use-cases';

// Mappers
import { CouponMapper } from './application/mappers/coupon.mapper';

@Module({
  imports: [],
  controllers: [CouponController],
  providers: [
    // Repositories
    {
      provide: 'ICouponRepository',
      useClass: PrismaCouponRepository,
    },
    {
      provide: 'IUserCouponRepository',
      useClass: PrismaUserCouponRepository,
    },

    // Domain Services
    CouponDomainService,

    // Mappers
    CouponMapper,

    // Use Cases
    GetAvailableCouponsUseCase,
    GetUserCouponsUseCase,
    GetCouponDetailUseCase,
    IssueCouponUseCase,
    IssueCouponByCodeUseCase,
    ValidateCouponUseCase,
    UseCouponUseCase,
    GetCouponStatisticsUseCase,
  ],
  exports: [
    CouponDomainService, // For OrderModule to use when validating and using coupons
    ValidateCouponUseCase, // For OrderModule
    UseCouponUseCase, // For OrderModule
  ],
})
export class CouponModule {}
