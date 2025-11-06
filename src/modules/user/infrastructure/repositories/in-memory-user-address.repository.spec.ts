import { InMemoryUserAddressRepository } from './in-memory-user-address.repository';
import { UserAddress } from '../../domain/entities/user-address.entity';

describe('InMemoryUserAddressRepository', () => {
  let repository: InMemoryUserAddressRepository;

  beforeEach(() => {
    repository = new InMemoryUserAddressRepository();
  });

  describe('초기 데이터 로드', () => {
    it('생성자 호출 시 6개의 테스트 배송지가 로드된다', async () => {
      // Given: 새로 생성된 repository
      // When: 모든 배송지 조회
      const addresses = await repository.findAll();

      // Then: 6개의 배송지 존재
      expect(addresses).toHaveLength(6);
    });

    it('사용자 1(홍길동)은 3개의 배송지를 가진다', async () => {
      // Given: repository
      // When: 사용자 1의 배송지 조회
      const addresses = await repository.findByUserId(1);

      // Then: 3개 반환
      expect(addresses).toHaveLength(3);
      expect(addresses[0].userId).toBe(1);
      expect(addresses[1].userId).toBe(1);
      expect(addresses[2].userId).toBe(1);
    });

    it('사용자 2(김철수)는 1개의 배송지를 가진다', async () => {
      // Given: repository
      // When: 사용자 2의 배송지 조회
      const addresses = await repository.findByUserId(2);

      // Then: 1개 반환
      expect(addresses).toHaveLength(1);
      expect(addresses[0].userId).toBe(2);
      expect(addresses[0].recipientName).toBe('김철수');
    });

    it('사용자 3(이영희)은 2개의 배송지를 가진다', async () => {
      // Given: repository
      // When: 사용자 3의 배송지 조회
      const addresses = await repository.findByUserId(3);

      // Then: 2개 반환
      expect(addresses).toHaveLength(2);
      expect(addresses[0].userId).toBe(3);
      expect(addresses[1].userId).toBe(3);
    });

    it('각 사용자는 1개의 기본 배송지를 가진다', async () => {
      // Given: repository
      // When: 각 사용자의 기본 배송지 조회
      const defaultAddress1 = await repository.findDefaultByUserId(1);
      const defaultAddress2 = await repository.findDefaultByUserId(2);
      const defaultAddress3 = await repository.findDefaultByUserId(3);

      // Then: 각 사용자별 기본 배송지 존재
      expect(defaultAddress1).not.toBeNull();
      expect(defaultAddress1!.id).toBe(1);
      expect(defaultAddress1!.isDefault).toBe(true);

      expect(defaultAddress2).not.toBeNull();
      expect(defaultAddress2!.id).toBe(4);
      expect(defaultAddress2!.isDefault).toBe(true);

      expect(defaultAddress3).not.toBeNull();
      expect(defaultAddress3!.id).toBe(6);
      expect(defaultAddress3!.isDefault).toBe(true);
    });

    it('초기 데이터의 배송지 1은 올바른 정보를 가진다', async () => {
      // Given: repository
      // When: 배송지 1 조회
      const address = await repository.findById(1);

      // Then: 배송지 정보 확인
      expect(address).not.toBeNull();
      expect(address!.userId).toBe(1);
      expect(address!.recipientName).toBe('홍길동');
      expect(address!.recipientPhone).toBe('010-1234-5678');
      expect(address!.postalCode).toBe('06234');
      expect(address!.addressDefaultText).toBe('서울시 강남구 테헤란로 123');
      expect(address!.addressDetailText).toBe('456호');
      expect(address!.isDefault).toBe(true);
    });
  });

  describe('findById', () => {
    it('존재하는 ID로 배송지를 조회할 수 있다', async () => {
      // Given: repository에 배송지 1 존재
      // When: findById(1) 호출
      const address = await repository.findById(1);

      // Then: UserAddress 엔티티 반환
      expect(address).not.toBeNull();
      expect(address).toBeInstanceOf(UserAddress);
      expect(address!.id).toBe(1);
    });

    it('존재하지 않는 ID로 조회하면 null을 반환한다', async () => {
      // Given: repository에 배송지 999 없음
      // When: findById(999) 호출
      const address = await repository.findById(999);

      // Then: null 반환
      expect(address).toBeNull();
    });

    it('조회된 UserAddress 엔티티는 메서드를 포함한다 (toEntity 검증)', async () => {
      // Given: repository에 배송지 1 존재
      // When: findById(1) 호출
      const address = await repository.findById(1);

      // Then: UserAddress 엔티티 메서드 사용 가능
      expect(address).not.toBeNull();
      expect(typeof address!.update).toBe('function');
      expect(typeof address!.setAsDefault).toBe('function');
      expect(typeof address!.unsetAsDefault).toBe('function');
    });

    it('조회된 UserAddress 엔티티의 메서드가 정상 동작한다', async () => {
      // Given: repository에 배송지 2 존재 (isDefault: false)
      // When: findById(2) 호출 후 update 메서드 호출
      const address = await repository.findById(2);
      expect(address).not.toBeNull();
      expect(address!.isDefault).toBe(false);

      // Then: update 메서드 정상 동작
      expect(() => address!.update({ recipientName: '새수령인' })).not.toThrow();
      expect(address!.recipientName).toBe('새수령인');
    });
  });

  describe('findByUserId', () => {
    it('사용자 ID로 모든 배송지를 조회할 수 있다', async () => {
      // Given: 사용자 1의 배송지 3개 존재
      // When: findByUserId(1) 호출
      const addresses = await repository.findByUserId(1);

      // Then: 3개 반환
      expect(addresses).toHaveLength(3);
      addresses.forEach((addr) => {
        expect(addr.userId).toBe(1);
        expect(addr).toBeInstanceOf(UserAddress);
      });
    });

    it('배송지가 없는 사용자 조회 시 빈 배열을 반환한다', async () => {
      // Given: 사용자 999의 배송지 없음
      // When: findByUserId(999) 호출
      const addresses = await repository.findByUserId(999);

      // Then: 빈 배열 반환
      expect(addresses).toHaveLength(0);
    });

    it('조회된 모든 UserAddress 엔티티는 메서드를 포함한다', async () => {
      // Given: repository
      // When: findByUserId(1) 호출
      const addresses = await repository.findByUserId(1);

      // Then: 모든 배송지가 메서드 포함
      expect(addresses.length).toBeGreaterThan(0);
      addresses.forEach((addr) => {
        expect(typeof addr.update).toBe('function');
        expect(typeof addr.setAsDefault).toBe('function');
      });
    });
  });

  describe('findDefaultByUserId', () => {
    it('사용자의 기본 배송지를 조회할 수 있다', async () => {
      // Given: 사용자 1의 기본 배송지 ID 1
      // When: findDefaultByUserId(1) 호출
      const defaultAddress = await repository.findDefaultByUserId(1);

      // Then: 배송지 1 반환
      expect(defaultAddress).not.toBeNull();
      expect(defaultAddress!.id).toBe(1);
      expect(defaultAddress!.userId).toBe(1);
      expect(defaultAddress!.isDefault).toBe(true);
    });

    it('기본 배송지가 없는 사용자는 null을 반환한다', async () => {
      // Given: 사용자 999의 배송지 없음
      // When: findDefaultByUserId(999) 호출
      const defaultAddress = await repository.findDefaultByUserId(999);

      // Then: null 반환
      expect(defaultAddress).toBeNull();
    });

    it('조회된 기본 배송지는 메서드를 포함한다', async () => {
      // Given: repository
      // When: findDefaultByUserId(2) 호출
      const defaultAddress = await repository.findDefaultByUserId(2);

      // Then: 메서드 존재
      expect(defaultAddress).not.toBeNull();
      expect(typeof defaultAddress!.update).toBe('function');
    });
  });

  describe('countByUserId', () => {
    it('사용자의 배송지 개수를 조회할 수 있다', async () => {
      // Given: 사용자 1의 배송지 3개
      // When: countByUserId(1) 호출
      const count = await repository.countByUserId(1);

      // Then: 3 반환
      expect(count).toBe(3);
    });

    it('배송지가 없는 사용자는 0을 반환한다', async () => {
      // Given: 사용자 999의 배송지 없음
      // When: countByUserId(999) 호출
      const count = await repository.countByUserId(999);

      // Then: 0 반환
      expect(count).toBe(0);
    });

    it('배송지 추가 후 개수가 증가한다', async () => {
      // Given: 사용자 2의 초기 배송지 1개
      const initialCount = await repository.countByUserId(2);
      expect(initialCount).toBe(1);

      // When: 새 배송지 추가
      const newAddress = UserAddress.create({
        id: 100,
        userId: 2,
        recipientName: '김철수2',
        recipientPhone: '010-1111-1111',
        postalCode: '12345',
        addressDefaultText:'새주소',
        addressDetailText: null,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
      await repository.create(newAddress as any);

      // Then: 개수 증가
      const newCount = await repository.countByUserId(2);
      expect(newCount).toBe(2);
    });
  });

  describe('findByIdAndUserId', () => {
    it('배송지 ID와 사용자 ID로 배송지를 조회할 수 있다', async () => {
      // Given: 사용자 1의 배송지 1
      // When: findByIdAndUserId(1, 1) 호출
      const address = await repository.findByIdAndUserId(1, 1);

      // Then: 배송지 1 반환
      expect(address).not.toBeNull();
      expect(address!.id).toBe(1);
      expect(address!.userId).toBe(1);
    });

    it('다른 사용자의 배송지를 조회하면 null을 반환한다 (권한 검증)', async () => {
      // Given: 배송지 1은 사용자 1 소유
      // When: 사용자 2로 배송지 1 조회
      const address = await repository.findByIdAndUserId(1, 2);

      // Then: null 반환 (권한 없음)
      expect(address).toBeNull();
    });

    it('존재하지 않는 배송지 조회 시 null을 반환한다', async () => {
      // Given: 배송지 999 없음
      // When: findByIdAndUserId(999, 1) 호출
      const address = await repository.findByIdAndUserId(999, 1);

      // Then: null 반환
      expect(address).toBeNull();
    });
  });

  describe('unsetDefaultByUserId', () => {
    it('사용자의 기본 배송지를 해제할 수 있다', async () => {
      // Given: 사용자 1의 기본 배송지 ID 1
      const beforeDefault = await repository.findDefaultByUserId(1);
      expect(beforeDefault!.id).toBe(1);

      // When: unsetDefaultByUserId(1) 호출
      await repository.unsetDefaultByUserId(1);

      // Then: 기본 배송지 없음
      const afterDefault = await repository.findDefaultByUserId(1);
      expect(afterDefault).toBeNull();
    });

    it('기본 배송지가 없는 사용자에게 호출해도 에러가 발생하지 않는다', async () => {
      // Given: 사용자 999의 배송지 없음
      // When & Then: 에러 발생하지 않음
      await expect(repository.unsetDefaultByUserId(999)).resolves.not.toThrow();
    });

    it('기본 배송지 해제 후 배송지는 여전히 존재한다', async () => {
      // Given: 사용자 1의 기본 배송지 ID 1
      // When: 기본 배송지 해제
      await repository.unsetDefaultByUserId(1);

      // Then: 배송지 1은 여전히 존재하며 isDefault만 false
      const address = await repository.findById(1);
      expect(address).not.toBeNull();
      expect(address!.isDefault).toBe(false);
    });
  });

  describe('setDefaultAddress', () => {
    it('배송지를 기본 배송지로 설정할 수 있다', async () => {
      // Given: 사용자 1의 기본 배송지 ID 1, 배송지 2는 기본 아님
      const beforeAddress2 = await repository.findById(2);
      expect(beforeAddress2!.isDefault).toBe(false);

      // When: 배송지 2를 기본 배송지로 설정
      const result = await repository.setDefaultAddress(1, 2);

      // Then: 배송지 2가 기본 배송지
      expect(result.id).toBe(2);
      expect(result.isDefault).toBe(true);
    });

    it('새로운 기본 배송지 설정 시 기존 기본 배송지가 해제된다', async () => {
      // Given: 사용자 1의 기본 배송지 ID 1
      const beforeDefault = await repository.findDefaultByUserId(1);
      expect(beforeDefault!.id).toBe(1);

      // When: 배송지 2를 기본 배송지로 설정
      await repository.setDefaultAddress(1, 2);

      // Then: 배송지 1의 기본 상태 해제
      const address1 = await repository.findById(1);
      expect(address1!.isDefault).toBe(false);

      // And: 배송지 2가 새로운 기본 배송지
      const address2 = await repository.findById(2);
      expect(address2!.isDefault).toBe(true);
    });

    it('한 사용자의 기본 배송지는 항상 1개만 존재한다', async () => {
      // Given: 사용자 1의 배송지 3개
      // When: 배송지 3을 기본 배송지로 설정
      await repository.setDefaultAddress(1, 3);

      // Then: 기본 배송지는 배송지 3만
      const addresses = await repository.findByUserId(1);
      const defaultAddresses = addresses.filter((addr) => addr.isDefault);
      expect(defaultAddresses).toHaveLength(1);
      expect(defaultAddresses[0].id).toBe(3);
    });

    it('존재하지 않는 배송지를 기본으로 설정하면 에러를 발생시킨다', async () => {
      // Given: 배송지 999 없음
      // When & Then: setDefaultAddress(1, 999) 호출 시 에러 발생
      await expect(repository.setDefaultAddress(1, 999)).rejects.toThrow(
        'Address not found',
      );
    });

    it('다른 사용자의 배송지 간 기본 배송지 설정은 독립적이다', async () => {
      // Given: 사용자 1의 기본 배송지 ID 1, 사용자 2의 기본 배송지 ID 4
      // When: 사용자 1의 기본 배송지를 2로 변경
      await repository.setDefaultAddress(1, 2);

      // Then: 사용자 2의 기본 배송지는 여전히 ID 4
      const user2Default = await repository.findDefaultByUserId(2);
      expect(user2Default!.id).toBe(4);
      expect(user2Default!.isDefault).toBe(true);
    });

    it('반환된 UserAddress 엔티티는 메서드를 포함한다', async () => {
      // Given: 사용자 1의 배송지 2
      // When: setDefaultAddress(1, 2) 호출
      const result = await repository.setDefaultAddress(1, 2);

      // Then: 메서드 존재
      expect(typeof result.update).toBe('function');
      expect(typeof result.setAsDefault).toBe('function');
    });
  });

  describe('create - 첫 번째 배송지 자동 기본 설정', () => {
    it('사용자의 첫 번째 배송지는 자동으로 기본 배송지로 설정된다', async () => {
      // Given: 사용자 999의 배송지 0개
      const count = await repository.countByUserId(999);
      expect(count).toBe(0);

      // When: 첫 번째 배송지 생성 (isDefault: false로 생성)
      const newAddress = UserAddress.create({
        id: 200,
        userId: 999,
        recipientName: '새사용자',
        recipientPhone: '010-1234-5678',
        postalCode: '12345',
        addressDefaultText:'새주소',
        addressDetailText: null,
        isDefault: false, // 명시적으로 false
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
      const created = await repository.create(newAddress as any);

      // Then: 자동으로 isDefault = true로 생성
      expect(created.isDefault).toBe(true);

      // And: 조회해도 isDefault = true
      const found = await repository.findDefaultByUserId(999);
      expect(found).not.toBeNull();
      expect(found!.isDefault).toBe(true);
    });

    it('두 번째 배송지 생성 시 isDefault를 명시하지 않으면 false로 생성된다', async () => {
      // Given: 사용자 999의 첫 번째 배송지 존재
      const firstAddress = UserAddress.create({
        id: 300,
        userId: 999,
        recipientName: '첫번째',
        recipientPhone: '010-1111-1111',
        postalCode: '11111',
        addressDefaultText:'첫번째주소',
        addressDetailText: null,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
      await repository.create(firstAddress as any);

      // When: 두 번째 배송지 생성 (isDefault 명시 안 함)
      const secondAddress = UserAddress.create({
        id: 301,
        userId: 999,
        recipientName: '두번째',
        recipientPhone: '010-2222-2222',
        postalCode: '22222',
        addressDefaultText:'두번째주소',
        addressDetailText: null,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
      const created = await repository.create(secondAddress as any);

      // Then: isDefault = false
      expect(created.isDefault).toBe(false);
    });

    it('새 배송지를 isDefault: true로 생성하면 기존 기본 배송지가 해제된다', async () => {
      // Given: 사용자 1의 기본 배송지 ID 1
      const beforeDefault = await repository.findDefaultByUserId(1);
      expect(beforeDefault!.id).toBe(1);

      // When: 새 배송지를 isDefault: true로 생성
      const newAddress = UserAddress.create({
        id: 400,
        userId: 1,
        recipientName: '새배송지',
        recipientPhone: '010-9999-9999',
        postalCode: '99999',
        addressDefaultText:'새주소',
        addressDetailText: null,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
      await repository.create(newAddress as any);

      // Then: 기존 기본 배송지(ID 1) 해제
      const address1 = await repository.findById(1);
      expect(address1!.isDefault).toBe(false);

      // And: 새 배송지가 기본 배송지
      const newDefault = await repository.findDefaultByUserId(1);
      expect(newDefault!.recipientName).toBe('새배송지');
    });
  });

  describe('delete - 기본 배송지 삭제 시 자동 재설정', () => {
    it('기본 배송지를 삭제하면 가장 최근 배송지가 기본 배송지로 설정된다', async () => {
      // Given: 사용자 1의 기본 배송지 ID 1, 나머지 2, 3
      const beforeDefault = await repository.findDefaultByUserId(1);
      expect(beforeDefault!.id).toBe(1);

      // When: 기본 배송지(ID 1) 삭제
      const deleted = await repository.delete(1);
      expect(deleted).toBe(true);

      // Then: 남은 배송지 중 가장 최근 배송지가 기본으로 설정
      const newDefault = await repository.findDefaultByUserId(1);
      expect(newDefault).not.toBeNull();
      expect(newDefault!.isDefault).toBe(true);
      // 배송지 2, 3 중 하나가 기본이어야 함
      expect([2, 3]).toContain(newDefault!.id);
    });

    it('기본이 아닌 배송지를 삭제하면 기본 배송지는 변경되지 않는다', async () => {
      // Given: 사용자 1의 기본 배송지 ID 1, 비기본 배송지 2, 3
      const beforeDefault = await repository.findDefaultByUserId(1);
      expect(beforeDefault!.id).toBe(1);

      // When: 비기본 배송지(ID 2) 삭제
      const deleted = await repository.delete(2);
      expect(deleted).toBe(true);

      // Then: 기본 배송지 여전히 ID 1
      const afterDefault = await repository.findDefaultByUserId(1);
      expect(afterDefault!.id).toBe(1);
      expect(afterDefault!.isDefault).toBe(true);
    });

    it('마지막 배송지를 삭제하면 기본 배송지가 없어진다', async () => {
      // Given: 사용자 2의 배송지 1개 (ID 4, isDefault: true)
      const beforeCount = await repository.countByUserId(2);
      expect(beforeCount).toBe(1);

      // When: 유일한 배송지 삭제
      await repository.delete(4);

      // Then: 배송지 없음
      const afterCount = await repository.countByUserId(2);
      expect(afterCount).toBe(0);

      // And: 기본 배송지 없음
      const defaultAddress = await repository.findDefaultByUserId(2);
      expect(defaultAddress).toBeNull();
    });

    it('존재하지 않는 배송지를 삭제하면 false를 반환한다', async () => {
      // Given: 배송지 999 없음
      // When: delete(999) 호출
      const deleted = await repository.delete(999);

      // Then: false 반환
      expect(deleted).toBe(false);
    });
  });

  describe('update', () => {
    it('배송지 정보를 수정할 수 있다', async () => {
      // Given: 배송지 1 존재
      // When: 수령인 이름 수정
      const updated = await repository.update(1, { recipientName: '수정된이름' } as any);

      // Then: 수정된 배송지 반환
      expect(updated).not.toBeNull();
      expect(updated).toBeInstanceOf(UserAddress);
      expect(updated!.recipientName).toBe('수정된이름');
    });

    it('수정된 배송지를 다시 조회하면 변경사항이 반영되어 있다', async () => {
      // Given: 배송지 2 수정
      await repository.update(2, { recipientPhone: '010-9999-9999' } as any);

      // When: 수정된 배송지 조회
      const found = await repository.findById(2);

      // Then: 변경사항 반영
      expect(found).not.toBeNull();
      expect(found!.recipientPhone).toBe('010-9999-9999');
    });

    it('수정된 UserAddress 엔티티는 메서드를 포함한다 (toEntity 검증)', async () => {
      // Given: 배송지 1 존재
      // When: 배송지 수정
      const updated = await repository.update(1, { addressDefaultText:'새주소' } as any);

      // Then: UserAddress 엔티티 메서드 사용 가능
      expect(updated).not.toBeNull();
      expect(typeof updated!.update).toBe('function');
      expect(typeof updated!.setAsDefault).toBe('function');
    });
  });

  describe('findAll', () => {
    it('모든 배송지를 조회할 수 있다', async () => {
      // Given: repository에 6개의 배송지 존재
      // When: findAll() 호출
      const addresses = await repository.findAll();

      // Then: 6개의 배송지 반환
      expect(addresses).toHaveLength(6);
      addresses.forEach((addr) => {
        expect(addr).toBeInstanceOf(UserAddress);
      });
    });

    it('조회된 모든 UserAddress 엔티티는 메서드를 포함한다 (toEntity 검증)', async () => {
      // Given: repository
      // When: findAll() 호출
      const addresses = await repository.findAll();

      // Then: 모든 배송지가 메서드 포함
      addresses.forEach((addr) => {
        expect(typeof addr.update).toBe('function');
        expect(typeof addr.setAsDefault).toBe('function');
        expect(typeof addr.unsetAsDefault).toBe('function');
      });
    });
  });

  describe('toEntity 변환 검증', () => {
    it('toEntity로 변환된 엔티티는 모든 필드를 포함한다', async () => {
      // Given: repository에 배송지 1 존재
      // When: 배송지 조회
      const address = await repository.findById(1);

      // Then: 모든 필드 존재
      expect(address).not.toBeNull();
      expect(address!.id).toBeDefined();
      expect(address!.userId).toBeDefined();
      expect(address!.recipientName).toBeDefined();
      expect(address!.recipientPhone).toBeDefined();
      expect(address!.postalCode).toBeDefined();
      expect(address!.addressDefaultText).toBeDefined();
      expect(address!.isDefault).toBeDefined();
      expect(address!.createdAt).toBeDefined();
      expect(address!.updatedAt).toBeDefined();
    });

    it('toEntity로 변환된 엔티티는 모든 메서드를 포함한다', async () => {
      // Given: repository에 배송지 1 존재
      // When: 배송지 조회
      const address = await repository.findById(1);

      // Then: 모든 메서드 존재
      expect(address).not.toBeNull();
      expect(typeof address!.update).toBe('function');
      expect(typeof address!.setAsDefault).toBe('function');
      expect(typeof address!.unsetAsDefault).toBe('function');
    });

    it('toEntity로 변환된 엔티티의 메서드가 실제로 동작한다', async () => {
      // Given: repository에 배송지 2 존재 (isDefault: false)
      // When: 배송지 조회
      const address = await repository.findById(2);
      expect(address).not.toBeNull();
      expect(address!.isDefault).toBe(false);

      // Then: setAsDefault() 메서드 정상 동작
      address!.setAsDefault();
      expect(address!.isDefault).toBe(true);

      // unsetAsDefault() 메서드도 정상 동작
      address!.unsetAsDefault();
      expect(address!.isDefault).toBe(false);

      // update() 메서드도 정상 동작
      address!.update({ recipientName: '새이름' });
      expect(address!.recipientName).toBe('새이름');
    });

    it('복잡한 시나리오: 조회 > 수정 > 저장 > 재조회가 정상 동작한다', async () => {
      // Given: 배송지 3 조회
      const address = await repository.findById(3);
      expect(address).not.toBeNull();

      // When: 배송지 정보 수정 후 저장
      address!.update({ recipientName: '홍부인수정', postalCode: '99999' });
      await repository.update(3, address! as any);

      // Then: 재조회 시 변경사항 반영
      const updated = await repository.findById(3);
      expect(updated).not.toBeNull();
      expect(updated!.recipientName).toBe('홍부인수정');
      expect(updated!.postalCode).toBe('99999');
      expect(typeof updated!.update).toBe('function');
    });
  });
});
