import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { configuration, validate } from './config';
import { PrismaModule } from './common/prisma';
import { RedisModule } from './common/redis';
import { KafkaModule } from './common/kafka';
import {
  ClsModule,
  EventLoggerService,
  TracedEventEmitter,
} from './common/cls';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CartModule } from './modules/cart/cart.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: ['.env'],
    }),
    ClsModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    RedisModule,
    KafkaModule,
    UserModule,
    ProductModule,
    PaymentModule,
    CartModule,
    CouponModule,
    OrderModule,
  ],
  controllers: [],
  providers: [EventLoggerService, TracedEventEmitter],
  exports: [EventLoggerService, TracedEventEmitter],
})
export class AppModule {}
