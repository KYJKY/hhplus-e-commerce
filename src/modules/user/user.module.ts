import { Module } from '@nestjs/common';
import { UserController } from './presentation/user.controller';
import { UserService } from './application/user.service';
import { InMemoryUserRepository } from './infrastructure/repositories/in-memory-user.repository';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: InMemoryUserRepository,
    },
  ],
})
export class UserModule {}
