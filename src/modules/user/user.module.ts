import { Module } from '@nestjs/common';
import { UserController } from './presentation/user.controller';
import { UserService } from './application/user.service';
import { InMemoryUserRepository } from './infrastructure/repositories/in-memory-user.repository';
import { InMemoryUserAddressRepository } from './infrastructure/repositories/in-memory-user-address.repository';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: InMemoryUserRepository,
    },
    {
      provide: 'IUserAddressRepository',
      useClass: InMemoryUserAddressRepository,
    },
  ],
  exports: [
    UserService,
    'IUserRepository', // PaymentModule에서 사용하기 위해 export
  ],
})
export class UserModule {}
