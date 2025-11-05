import { IRepository } from 'src/common';
import { User } from '../entities/user.entity';

/**
 * User 도메인 Repository 인터페이스
 */
export interface IUserRepository extends IRepository<User> {
  /**
   * 로그인 ID로 사용자 조회
   */
  findByLoginId(loginId: string): Promise<User | null>;

  /**
   * 이메일로 사용자 조회
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * 포인트 차감 (비관적 락)
   * 동시성 제어가 필요한 경우
   */
  deductPointWithLock(userId: number, amount: number): Promise<User>;
}
