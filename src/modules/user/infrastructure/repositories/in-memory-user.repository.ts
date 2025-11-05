import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { BaseInMemoryRepository } from 'src/common';

@Injectable()
export class InMemoryUserRepository
  extends BaseInMemoryRepository<User>
  implements IUserRepository
{
  async findByLoginId(loginId: string): Promise<User | null> {
    const result = await this.findOne((user) => user.loginId === loginId);
    return this.delay(result);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.findOne((user) => user.email === email);
  }
  deductPointWithLock(userId: number, amount: number): Promise<User> {
    throw new Error('Method not implemented.');
  }
}
