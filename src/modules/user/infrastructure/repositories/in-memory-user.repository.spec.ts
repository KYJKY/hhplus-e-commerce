import { InMemoryUserRepository } from './in-memory-user.repository';
import { User } from '../../domain/entities/user.entity';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe('초기 데이터 로드', () => {
    it('생성자 호출 시 3명의 테스트 사용자가 로드된다', async () => {
      // Given: 새로 생성된 repository
      // When: 모든 사용자 조회
      const users = await repository.findAll();

      // Then: 3명의 사용자 존재
      expect(users).toHaveLength(3);
      expect(users[0].id).toBe(1);
      expect(users[1].id).toBe(2);
      expect(users[2].id).toBe(3);
    });

    it('초기 데이터의 사용자 1은 올바른 정보를 가진다', async () => {
      // Given: repository
      // When: 사용자 1 조회
      const user = await repository.findById(1);

      // Then: 사용자 1의 정보 확인
      expect(user).not.toBeNull();
      expect(user!.loginId).toBe('user1');
      expect(user!.email).toBe('user1@example.com');
      expect(user!.name).toBe('홍길동');
      expect(user!.displayName).toBe('길동이');
      expect(user!.phoneNumber).toBe('010-1234-5678');
      expect(user!.getPoint()).toBe(100000);
    });

    it('초기 데이터의 사용자 2는 올바른 정보를 가진다', async () => {
      // Given: repository
      // When: 사용자 2 조회
      const user = await repository.findById(2);

      // Then: 사용자 2의 정보 확인
      expect(user).not.toBeNull();
      expect(user!.loginId).toBe('user2');
      expect(user!.email).toBe('user2@example.com');
      expect(user!.name).toBe('김철수');
      expect(user!.displayName).toBe('철수');
      expect(user!.getPoint()).toBe(50000);
    });

    it('초기 데이터의 사용자 3은 올바른 정보를 가진다', async () => {
      // Given: repository
      // When: 사용자 3 조회
      const user = await repository.findById(3);

      // Then: 사용자 3의 정보 확인
      expect(user).not.toBeNull();
      expect(user!.loginId).toBe('user3');
      expect(user!.email).toBe('user3@example.com');
      expect(user!.name).toBe('이영희');
      expect(user!.displayName).toBe('영희');
      expect(user!.getPoint()).toBe(200000);
    });
  });

  describe('findById', () => {
    it('존재하는 ID로 사용자를 조회할 수 있다', async () => {
      // Given: repository에 사용자 1 존재
      // When: findById(1) 호출
      const user = await repository.findById(1);

      // Then: User 엔티티 반환
      expect(user).not.toBeNull();
      expect(user).toBeInstanceOf(User);
      expect(user!.id).toBe(1);
      expect(user!.name).toBe('홍길동');
    });

    it('존재하지 않는 ID로 조회하면 null을 반환한다', async () => {
      // Given: repository에 사용자 999 없음
      // When: findById(999) 호출
      const user = await repository.findById(999);

      // Then: null 반환
      expect(user).toBeNull();
    });

    it('조회된 User 엔티티는 메서드를 포함한다 (toEntity 검증)', async () => {
      // Given: repository에 사용자 1 존재
      // When: findById(1) 호출
      const user = await repository.findById(1);

      // Then: User 엔티티 메서드 사용 가능
      expect(user).not.toBeNull();
      expect(typeof user!.updateProfile).toBe('function');
      expect(typeof user!.chargePoint).toBe('function');
      expect(typeof user!.deductPoint).toBe('function');
      expect(typeof user!.getPoint).toBe('function');
    });

    it('조회된 User 엔티티의 메서드가 정상 동작한다', async () => {
      // Given: repository에 사용자 1 존재 (초기 point: 100,000)
      // When: findById(1) 호출 후 updateProfile 메서드 호출
      const user = await repository.findById(1);
      expect(user).not.toBeNull();

      // Then: updateProfile 메서드 정상 동작
      expect(() => user!.updateProfile({ name: '홍길동2' })).not.toThrow();
      expect(user!.name).toBe('홍길동2');
    });
  });

  describe('findOne', () => {
    it('조건에 맞는 사용자를 조회할 수 있다', async () => {
      // Given: repository에 사용자들 존재
      // When: 이름이 '김철수'인 사용자 조회
      const user = await repository.findOne((u) => u.name === '김철수');

      // Then: 사용자 2 반환
      expect(user).not.toBeNull();
      expect(user).toBeInstanceOf(User);
      expect(user!.id).toBe(2);
      expect(user!.name).toBe('김철수');
    });

    it('조건에 맞는 사용자가 없으면 null을 반환한다', async () => {
      // Given: repository
      // When: 존재하지 않는 이름으로 조회
      const user = await repository.findOne((u) => u.name === '존재하지않는이름');

      // Then: null 반환
      expect(user).toBeNull();
    });

    it('조회된 User 엔티티는 메서드를 포함한다 (toEntity 검증)', async () => {
      // Given: repository
      // When: findOne으로 사용자 조회
      const user = await repository.findOne((u) => u.loginId === 'user2');

      // Then: User 엔티티 메서드 사용 가능
      expect(user).not.toBeNull();
      expect(typeof user!.updateProfile).toBe('function');
      expect(typeof user!.chargePoint).toBe('function');
    });
  });

  describe('findAll', () => {
    it('모든 사용자를 조회할 수 있다', async () => {
      // Given: repository에 3명의 사용자 존재
      // When: findAll() 호출
      const users = await repository.findAll();

      // Then: 3명의 사용자 반환
      expect(users).toHaveLength(3);
      expect(users[0]).toBeInstanceOf(User);
      expect(users[1]).toBeInstanceOf(User);
      expect(users[2]).toBeInstanceOf(User);
    });

    it('조회된 모든 User 엔티티는 메서드를 포함한다 (toEntity 검증)', async () => {
      // Given: repository
      // When: findAll() 호출
      const users = await repository.findAll();

      // Then: 모든 사용자가 메서드 포함
      users.forEach((user) => {
        expect(typeof user.updateProfile).toBe('function');
        expect(typeof user.chargePoint).toBe('function');
        expect(typeof user.deductPoint).toBe('function');
        expect(typeof user.getPoint).toBe('function');
      });
    });

    it('새로운 사용자 추가 후 findAll은 추가된 사용자를 포함한다', async () => {
      // Given: repository에 3명 존재
      const newUser = User.create({
        id: 4,
        loginId: 'user4',
        loginPassword: 'password',
        email: 'user4@example.com',
        name: '박민수',
        displayName: '민수',
        phoneNumber: '010-4567-8901',
        point: 0,
        lastLoginAt: new Date().toISOString(),
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });

      // When: 새 사용자 생성 후 findAll
      await repository.create(newUser);
      const users = await repository.findAll();

      // Then: 4명 반환
      expect(users).toHaveLength(4);
      expect(users[3].id).toBe(4);
      expect(users[3].name).toBe('박민수');
    });
  });

  describe('findMany', () => {
    it('조건에 맞는 사용자 목록을 조회할 수 있다', async () => {
      // Given: repository에 3명 존재
      // When: point가 100,000 이상인 사용자 조회
      const users = await repository.findMany((u) => u.getPoint() >= 100000);

      // Then: 사용자 1, 3 반환 (100,000, 200,000)
      expect(users).toHaveLength(2);
      expect(users[0].id).toBe(1);
      expect(users[1].id).toBe(3);
    });

    it('조건에 맞는 사용자가 없으면 빈 배열을 반환한다', async () => {
      // Given: repository
      // When: 존재하지 않는 조건으로 조회
      const users = await repository.findMany((u) => u.name === '없는이름');

      // Then: 빈 배열 반환
      expect(users).toHaveLength(0);
    });

    it('조회된 모든 User 엔티티는 메서드를 포함한다 (toEntity 검증)', async () => {
      // Given: repository
      // When: findMany로 사용자 조회
      const users = await repository.findMany((u) => u.getPoint() > 0);

      // Then: 모든 사용자가 메서드 포함
      expect(users.length).toBeGreaterThan(0);
      users.forEach((user) => {
        expect(typeof user.updateProfile).toBe('function');
        expect(typeof user.chargePoint).toBe('function');
      });
    });
  });

  describe('create', () => {
    it('새로운 사용자를 생성할 수 있다', async () => {
      // Given: 새 사용자 엔티티
      const newUser = User.create({
        id: 10,
        loginId: 'newuser',
        loginPassword: 'password',
        email: 'new@example.com',
        name: '새사용자',
        displayName: '새로운',
        phoneNumber: '010-9999-9999',
        point: 0,
        lastLoginAt: new Date().toISOString(),
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });

      // When: create() 호출
      const created = await repository.create(newUser);

      // Then: 생성된 사용자 반환
      expect(created).toBeInstanceOf(User);
      expect(created.loginId).toBe('newuser');
      expect(created.name).toBe('새사용자');
    });

    it('생성된 사용자를 다시 조회할 수 있다', async () => {
      // Given: 새 사용자 생성
      const newUser = User.create({
        id: 20,
        loginId: 'testuser',
        loginPassword: 'password',
        email: 'test@example.com',
        name: '테스트',
        displayName: '테스터',
        phoneNumber: '010-1111-1111',
        point: 5000,
        lastLoginAt: new Date().toISOString(),
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
      await repository.create(newUser);

      // When: 생성된 사용자 ID로 조회
      const found = await repository.findById(20);

      // Then: 조회 성공
      expect(found).not.toBeNull();
      expect(found!.loginId).toBe('testuser');
      expect(found!.getPoint()).toBe(5000);
    });
  });

  describe('update', () => {
    it('사용자 정보를 수정할 수 있다', async () => {
      // Given: 사용자 1 존재
      // When: 이름 수정
      const updated = await repository.update(1, { name: '수정된이름' } as any);

      // Then: 수정된 사용자 반환
      expect(updated).not.toBeNull();
      expect(updated).toBeInstanceOf(User);
      expect(updated!.name).toBe('수정된이름');
    });

    it('수정된 사용자를 다시 조회하면 변경사항이 반영되어 있다', async () => {
      // Given: 사용자 2 수정
      await repository.update(2, { displayName: '새닉네임' } as any);

      // When: 수정된 사용자 조회
      const found = await repository.findById(2);

      // Then: 변경사항 반영
      expect(found).not.toBeNull();
      expect(found!.displayName).toBe('새닉네임');
    });

    it('존재하지 않는 사용자를 수정하면 null을 반환한다', async () => {
      // Given: 사용자 999 없음
      // When: update(999) 호출
      const updated = await repository.update(999, { name: '이름' } as any);

      // Then: null 반환
      expect(updated).toBeNull();
    });

    it('수정된 User 엔티티는 메서드를 포함한다 (toEntity 검증)', async () => {
      // Given: 사용자 1 존재
      // When: 사용자 수정
      const updated = await repository.update(1, { name: '새이름' } as any);

      // Then: User 엔티티 메서드 사용 가능
      expect(updated).not.toBeNull();
      expect(typeof updated!.updateProfile).toBe('function');
      expect(typeof updated!.chargePoint).toBe('function');
      expect(typeof updated!.deductPoint).toBe('function');
    });
  });

  describe('delete', () => {
    it('사용자를 삭제할 수 있다', async () => {
      // Given: 사용자 1 존재
      // When: delete(1) 호출
      const result = await repository.delete(1);

      // Then: true 반환
      expect(result).toBe(true);
    });

    it('삭제된 사용자는 조회되지 않는다', async () => {
      // Given: 사용자 2 삭제
      await repository.delete(2);

      // When: 삭제된 사용자 조회
      const found = await repository.findById(2);

      // Then: null 반환
      expect(found).toBeNull();
    });

    it('존재하지 않는 사용자를 삭제하면 false를 반환한다', async () => {
      // Given: 사용자 999 없음
      // When: delete(999) 호출
      const result = await repository.delete(999);

      // Then: false 반환
      expect(result).toBe(false);
    });
  });

  describe('findByLoginId', () => {
    it('로그인 ID로 사용자를 조회할 수 있다', async () => {
      // Given: repository에 user1 존재
      // When: findByLoginId('user1') 호출
      const user = await repository.findByLoginId('user1');

      // Then: 사용자 1 반환
      expect(user).not.toBeNull();
      expect(user).toBeInstanceOf(User);
      expect(user!.id).toBe(1);
      expect(user!.loginId).toBe('user1');
      expect(user!.name).toBe('홍길동');
    });

    it('존재하지 않는 로그인 ID로 조회하면 null을 반환한다', async () => {
      // Given: repository
      // When: 존재하지 않는 로그인 ID로 조회
      const user = await repository.findByLoginId('nonexistent');

      // Then: null 반환
      expect(user).toBeNull();
    });

    it('조회된 User 엔티티는 메서드를 포함한다', async () => {
      // Given: repository
      // When: findByLoginId로 사용자 조회
      const user = await repository.findByLoginId('user2');

      // Then: User 엔티티 메서드 사용 가능
      expect(user).not.toBeNull();
      expect(typeof user!.updateProfile).toBe('function');
      expect(typeof user!.getPoint).toBe('function');
    });
  });

  describe('findByEmail', () => {
    it('이메일로 사용자를 조회할 수 있다', async () => {
      // Given: repository에 user2@example.com 존재
      // When: findByEmail('user2@example.com') 호출
      const user = await repository.findByEmail('user2@example.com');

      // Then: 사용자 2 반환
      expect(user).not.toBeNull();
      expect(user).toBeInstanceOf(User);
      expect(user!.id).toBe(2);
      expect(user!.email).toBe('user2@example.com');
      expect(user!.name).toBe('김철수');
    });

    it('존재하지 않는 이메일로 조회하면 null을 반환한다', async () => {
      // Given: repository
      // When: 존재하지 않는 이메일로 조회
      const user = await repository.findByEmail('nonexistent@example.com');

      // Then: null 반환
      expect(user).toBeNull();
    });

    it('조회된 User 엔티티는 메서드를 포함한다', async () => {
      // Given: repository
      // When: findByEmail로 사용자 조회
      const user = await repository.findByEmail('user3@example.com');

      // Then: User 엔티티 메서드 사용 가능
      expect(user).not.toBeNull();
      expect(typeof user!.updateProfile).toBe('function');
      expect(typeof user!.chargePoint).toBe('function');
    });
  });

  describe('toEntity 변환 검증', () => {
    it('toEntity로 변환된 엔티티는 모든 필드를 포함한다', async () => {
      // Given: repository에 사용자 1 존재
      // When: 사용자 조회
      const user = await repository.findById(1);

      // Then: 모든 필드 존재
      expect(user).not.toBeNull();
      expect(user!.id).toBeDefined();
      expect(user!.loginId).toBeDefined();
      expect(user!.loginPassword).toBeDefined();
      expect(user!.email).toBeDefined();
      expect(user!.name).toBeDefined();
      expect(user!.displayName).toBeDefined();
      expect(user!.phoneNumber).toBeDefined();
      expect(user!.lastLoginAt).toBeDefined();
      expect(user!.deletedAt).toBeDefined();
      expect(user!.createdAt).toBeDefined();
      expect(user!.updatedAt).toBeDefined();
    });

    it('toEntity로 변환된 엔티티는 모든 메서드를 포함한다', async () => {
      // Given: repository에 사용자 1 존재
      // When: 사용자 조회
      const user = await repository.findById(1);

      // Then: 모든 메서드 존재
      expect(user).not.toBeNull();
      expect(typeof user!.updateProfile).toBe('function');
      expect(typeof user!.chargePoint).toBe('function');
      expect(typeof user!.deductPoint).toBe('function');
      expect(typeof user!.getPoint).toBe('function');
    });

    it('toEntity로 변환된 엔티티의 메서드가 실제로 동작한다', async () => {
      // Given: repository에 사용자 1 존재 (초기 point: 100,000)
      // When: 사용자 조회 후 point 조회
      const user = await repository.findById(1);
      expect(user).not.toBeNull();

      // Then: getPoint() 메서드 정상 동작
      const point = user!.getPoint();
      expect(point).toBe(100000);

      // chargePoint() 메서드도 정상 동작
      user!.chargePoint(10000);
      expect(user!.getPoint()).toBe(110000);

      // deductPoint() 메서드도 정상 동작
      user!.deductPoint(5000);
      expect(user!.getPoint()).toBe(105000);
    });

    it('복잡한 시나리오: 조회 > 수정 > 저장 > 재조회가 정상 동작한다', async () => {
      // Given: 사용자 1 조회
      const user = await repository.findById(1);
      expect(user).not.toBeNull();

      // When: 프로필 수정 후 저장
      user!.updateProfile({ name: '홍길동수정', displayName: '수정된닉네임' });
      await repository.update(1, user! as any);

      // Then: 재조회 시 변경사항 반영
      const updated = await repository.findById(1);
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('홍길동수정');
      expect(updated!.displayName).toBe('수정된닉네임');
      expect(typeof updated!.updateProfile).toBe('function');
    });
  });

  describe('deductPointWithLock', () => {
    it('deductPointWithLock은 아직 구현되지 않아 에러를 발생시킨다', async () => {
      // Given: repository
      // When & Then: deductPointWithLock 호출 시 에러 발생
      await expect(repository.deductPointWithLock(1, 1000)).rejects.toThrow(
        'Method not implemented.',
      );
    });
  });
});
