import { Module } from '@nestjs/common';
import { CouponController } from './presentation/coupon.controller';
import {
  PrismaCouponRepository,
  PrismaUserCouponRepository,
} from './infrastructure/repositories';
import { RedisCouponStockRepository } from './infrastructure/repositories/redis-coupon-stock.repository';

// Domain Services
import { CouponDomainService } from './domain/services/coupon-domain.service';

// Application Services
import { CouponIssuanceApplicationService } from './application/services/coupon-issuance-app.service';

// Infrastructure Services
import { CouponStockSyncService } from './infrastructure/services/coupon-stock-sync.service';

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
    {
      provide: 'ICouponStockRepository',
      useClass: RedisCouponStockRepository,
    },

    // Domain Services
    CouponDomainService,

    // Application Services
    CouponIssuanceApplicationService,

    // Infrastructure Services
    CouponStockSyncService,

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
    CouponStockSyncService, // For external modules
  ],
})
export class CouponModule {}
