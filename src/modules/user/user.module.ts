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
    UserService, // PaymentModule에서 UserService를 사용하기 위해 export
  ],
})
export class UserModule {}
