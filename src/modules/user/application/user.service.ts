import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/entities/user.entity';
import type { IUserRepository } from '../domain/repositories/user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * 사용자 ID로 사용자 정보 조회
   * @param userId - 사용자 ID
   */
  async getUserById(userId: number): Promise<User | null> {
    return await this.userRepository.findById(userId);
  }
}
