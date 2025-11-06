import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, validate } from './config';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: ['.env'],
    }),
    UserModule,
    ProductModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
