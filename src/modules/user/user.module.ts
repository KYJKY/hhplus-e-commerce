import { Module } from '@nestjs/common';
import { UserController } from './presentation/user.controller';
import {
  InMemoryUserRepository,
  InMemoryUserAddressRepository,
  PrismaUserRepository,
  PrismaUserAddressRepository,
} from './infrastructure/repositories';

// Domain Services
import { UserDomainService } from './domain/services/user-domain.service';

// Mappers
import { UserMapper } from './application/mappers/user.mapper';
import { UserAddressMapper } from './application/mappers/user-address.mapper';

// Use Cases
import {
  GetUserInfoUseCase,
  GetUserProfileUseCase,
  UpdateUserProfileUseCase,
  GetAddressListUseCase,
  GetAddressDetailUseCase,
  CreateAddressUseCase,
  UpdateAddressUseCase,
  DeleteAddressUseCase,
  SetDefaultAddressUseCase,
  GetDefaultAddressUseCase,
} from './application/use-cases';

@Module({
  controllers: [UserController],
  providers: [
    // Repositories
    {
      provide: 'IUserRepository',
      useClass:
        process.env.USE_IN_MEMORY_DB === 'true'
          ? InMemoryUserRepository
          : PrismaUserRepository,
    },
    {
      provide: 'IUserAddressRepository',
      useClass:
        process.env.USE_IN_MEMORY_DB === 'true'
          ? InMemoryUserAddressRepository
          : PrismaUserAddressRepository,
    },

    // Domain Services
    UserDomainService,

    // Mappers
    UserMapper,
    UserAddressMapper,

    // Use Cases
    GetUserInfoUseCase,
    GetUserProfileUseCase,
    UpdateUserProfileUseCase,
    GetAddressListUseCase,
    GetAddressDetailUseCase,
    CreateAddressUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    SetDefaultAddressUseCase,
    GetDefaultAddressUseCase,
  ],
  exports: [
    UserDomainService, // PaymentModule에서 사용하기 위해 export
  ],
})
export class UserModule {}
