import { PrismaClient } from '@prisma/client';
import { TestDatabaseHelper } from './helpers/test-database.helper';
import { InventoryTestFixture } from './helpers/inventory-test.fixture';
import { PrismaProductOptionRepository } from '../src/modules/product/infrastructure/repositories/prisma-product-option.repository';
import { InventoryDomainService } from '../src/modules/product/domain/services/inventory-domain.service';
import { PrismaProductRepository } from '../src/modules/product/infrastructure/repositories/prisma-product.repository';

/**
 * 재고 차감 동시성 테스트
 *
 * 목적:
 * - Race Condition으로 인한 재고 음수 방지 검증
 * - 동시 요청 상황에서 정확히 재고만큼만 차감되는지 확인
 * - FOR UPDATE를 통한 비관적 락 동작 검증
 *
 * 테스트 환경:
 * - TestContainer 기반 실제 MySQL 8.0 환경
 * - Mock 없이 실제 Prisma + Repository 사용
 */
describe('Inventory Deduction Concurrency (e2e)', () => {
  let prisma: PrismaClient;
  let fixture: InventoryTestFixture;
  let productRepository: PrismaProductRepository;
  let productOptionRepository: PrismaProductOptionRepository;
  let inventoryDomainService: InventoryDomainService;

  beforeAll(async () => {
    // TestContainer 기반 MySQL 시작
    prisma = await TestDatabaseHelper.setup();
    fixture = new InventoryTestFixture(prisma);

    // Repository 직접 인스턴스화
    productRepository = new PrismaProductRepository(prisma as any);
    productOptionRepository = new PrismaProductOptionRepository(prisma as any);

    // Domain Service 직접 인스턴스화
    inventoryDomainService = new InventoryDomainService(
      productRepository,
      productOptionRepository,
    );
  }, 60000);

  afterAll(async () => {
    await TestDatabaseHelper.teardown();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터 초기화
    await TestDatabaseHelper.cleanup();
  });

  describe('재고 음수 방지', () => {
    it('동시에 100명이 1개씩 주문해도 재고 100개를 초과 차감하지 않아야 함', async () => {
      // Given: 재고 100개인 상품 옵션 생성
      const product = await fixture.createProduct({
        productName: '인기 티셔츠',
      });

      const option = await fixture.createProductOption({
        productId: product.id,
        optionName: '블랙/L',
        stockQuantity: 100,
      });

      // 100명의 주문 생성
      const orders = await Promise.all(
        Array.from({ length: 100 }, async (_, i) => {
          const user = await fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          });
          const order = await fixture.createOrder({
            userId: user.id,
            orderNumber: `ORD${Date.now()}_${i}`,
          });
          return { orderId: Number(order.id), optionId: Number(option.id) };
        }),
      );

      // When: 100명이 동시에 재고 차감 요청 (각 1개)
      const results = await Promise.allSettled(
        orders.map(({ orderId, optionId }) =>
          inventoryDomainService.deductStock(optionId, 1, orderId),
        ),
      );

      // Then: 정확히 100개만 성공
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(100);
      expect(failed).toBe(0);

      // 최종 재고 확인
      const finalOption = await prisma.product_options.findUnique({
        where: { id: option.id },
      });
      expect(finalOption?.stock_quantity).toBe(0);
    }, 30000);

    it('동시에 150명이 1개씩 주문하면 100개만 성공하고 50개는 실패해야 함 (음수 방지)', async () => {
      // Given: 재고 100개인 상품 옵션
      const product = await fixture.createProduct({
        productName: '한정판 후드',
      });

      const option = await fixture.createProductOption({
        productId: product.id,
        optionName: '네이비/XL',
        stockQuantity: 100,
      });

      // 150명의 주문 생성
      const orders = await Promise.all(
        Array.from({ length: 150 }, async (_, i) => {
          const user = await fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          });
          const order = await fixture.createOrder({
            userId: user.id,
            orderNumber: `ORD${Date.now()}_${i}`,
          });
          return { orderId: Number(order.id), optionId: Number(option.id) };
        }),
      );

      // When: 150명이 동시에 재고 차감 요청
      const results = await Promise.allSettled(
        orders.map(({ orderId, optionId }) =>
          inventoryDomainService.deductStock(optionId, 1, orderId),
        ),
      );

      // Then: 정확히 100개만 성공, 50개는 실패
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(100);
      expect(failed).toBe(50);

      // 최종 재고 확인 (0 이상이어야 함)
      const finalOption = await prisma.product_options.findUnique({
        where: { id: option.id },
      });
      expect(finalOption?.stock_quantity).toBe(0);
      expect(finalOption?.stock_quantity).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('재고가 거의 소진된 상황에서 동시 요청 시 정확히 남은 개수만큼만 차감되어야 함', async () => {
      // Given: 재고 5개만 남은 상품 옵션
      const product = await fixture.createProduct({
        productName: '거의 품절 상품',
      });

      const option = await fixture.createProductOption({
        productId: product.id,
        optionName: '화이트/M',
        stockQuantity: 5,
      });

      // 20명의 주문 생성
      const orders = await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const user = await fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          });
          const order = await fixture.createOrder({
            userId: user.id,
            orderNumber: `ORD${Date.now()}_${i}`,
          });
          return { orderId: Number(order.id), optionId: Number(option.id) };
        }),
      );

      // When: 20명이 동시에 재고 차감 요청 (실제로는 5개만 남음)
      const results = await Promise.allSettled(
        orders.map(({ orderId, optionId }) =>
          inventoryDomainService.deductStock(optionId, 1, orderId),
        ),
      );

      // Then: 정확히 5개만 성공, 15개는 실패
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(5);
      expect(failed).toBe(15);

      // 최종 재고는 0
      const finalOption = await prisma.product_options.findUnique({
        where: { id: option.id },
      });
      expect(finalOption?.stock_quantity).toBe(0);
    }, 30000);
  });

  describe('대량 주문 동시성', () => {
    it('동시에 여러 개씩 주문해도 정확한 재고 차감이 되어야 함', async () => {
      // Given: 재고 100개인 상품 옵션
      const product = await fixture.createProduct({
        productName: '인기 청바지',
      });

      const option = await fixture.createProductOption({
        productId: product.id,
        optionName: '블루/32',
        stockQuantity: 100,
      });

      // 20명이 각각 5개씩 주문 (총 100개)
      const orders = await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const user = await fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          });
          const order = await fixture.createOrder({
            userId: user.id,
            orderNumber: `ORD${Date.now()}_${i}`,
          });
          return {
            orderId: Number(order.id),
            optionId: Number(option.id),
            quantity: 5,
          };
        }),
      );

      // When: 20명이 동시에 각 5개씩 재고 차감 요청
      const results = await Promise.allSettled(
        orders.map(({ orderId, optionId, quantity }) =>
          inventoryDomainService.deductStock(optionId, quantity, orderId),
        ),
      );

      // Then: 정확히 20개 모두 성공
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(20);
      expect(failed).toBe(0);

      // 최종 재고는 0
      const finalOption = await prisma.product_options.findUnique({
        where: { id: option.id },
      });
      expect(finalOption?.stock_quantity).toBe(0);
    }, 30000);

    it('대량 주문 시 재고 부족하면 정확히 실패해야 함', async () => {
      // Given: 재고 100개인 상품 옵션
      const product = await fixture.createProduct({
        productName: '인기 스니커즈',
      });

      const option = await fixture.createProductOption({
        productId: product.id,
        optionName: '화이트/270',
        stockQuantity: 100,
      });

      // 30명이 각각 5개씩 주문 (총 150개 요청, 100개만 가능)
      const orders = await Promise.all(
        Array.from({ length: 30 }, async (_, i) => {
          const user = await fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          });
          const order = await fixture.createOrder({
            userId: user.id,
            orderNumber: `ORD${Date.now()}_${i}`,
          });
          return {
            orderId: Number(order.id),
            optionId: Number(option.id),
            quantity: 5,
          };
        }),
      );

      // When: 30명이 동시에 각 5개씩 재고 차감 요청
      const results = await Promise.allSettled(
        orders.map(({ orderId, optionId, quantity }) =>
          inventoryDomainService.deductStock(optionId, quantity, orderId),
        ),
      );

      // Then: 20개 성공, 10개 실패 (20 * 5 = 100개)
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(20);
      expect(failed).toBe(10);

      // 최종 재고는 0
      const finalOption = await prisma.product_options.findUnique({
        where: { id: option.id },
      });
      expect(finalOption?.stock_quantity).toBe(0);
      expect(finalOption?.stock_quantity).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('다수 옵션 동시 차감', () => {
    it('서로 다른 옵션에 대한 동시 차감은 서로 영향을 주지 않아야 함', async () => {
      // Given: 같은 상품의 3가지 옵션 (각각 재고 50개)
      const product = await fixture.createProduct({
        productName: '베이직 티셔츠',
      });

      const options = await Promise.all([
        fixture.createProductOption({
          productId: product.id,
          optionName: '블랙/S',
          stockQuantity: 50,
        }),
        fixture.createProductOption({
          productId: product.id,
          optionName: '화이트/M',
          stockQuantity: 50,
        }),
        fixture.createProductOption({
          productId: product.id,
          optionName: '그레이/L',
          stockQuantity: 50,
        }),
      ]);

      // 각 옵션마다 60명이 주문 시도 (총 180명)
      const allOrders = await Promise.all(
        options.flatMap((option) =>
          Array.from({ length: 60 }, async (_, i) => {
            const user = await fixture.createUser({
              loginId: `user_${option.id}_${i}`,
              email: `user_${option.id}_${i}@test.com`,
              name: `사용자${i}`,
            });
            const order = await fixture.createOrder({
              userId: user.id,
              orderNumber: `ORD${Date.now()}_${option.id}_${i}`,
            });
            return {
              orderId: Number(order.id),
              optionId: Number(option.id),
            };
          }),
        ),
      );

      // When: 180명이 동시에 각자의 옵션 재고 차감 요청
      const results = await Promise.allSettled(
        allOrders.map(({ orderId, optionId }) =>
          inventoryDomainService.deductStock(optionId, 1, orderId),
        ),
      );

      // Then: 각 옵션마다 50개씩 총 150개 성공, 30개 실패
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(150); // 50 * 3
      expect(failed).toBe(30); // 10 * 3

      // 각 옵션의 최종 재고 확인
      for (const option of options) {
        const finalOption = await prisma.product_options.findUnique({
          where: { id: option.id },
        });
        expect(finalOption?.stock_quantity).toBe(0);
      }
    }, 30000);
  });

  describe('데이터 정합성 검증', () => {
    it('동시 차감 후 실제 차감된 총량과 재고 감소량이 일치해야 함', async () => {
      // Given: 재고 200개인 상품 옵션
      const product = await fixture.createProduct({
        productName: '데이터 정합성 테스트 상품',
      });

      const option = await fixture.createProductOption({
        productId: product.id,
        optionName: '블루/L',
        stockQuantity: 200,
      });

      const initialStock = option.stock_quantity;

      // 100명의 주문 생성 (랜덤 수량 1~3개)
      const orders = await Promise.all(
        Array.from({ length: 100 }, async (_, i) => {
          const user = await fixture.createUser({
            loginId: `user${i}`,
            email: `user${i}@test.com`,
            name: `사용자${i}`,
          });
          const order = await fixture.createOrder({
            userId: user.id,
            orderNumber: `ORD${Date.now()}_${i}`,
          });
          const quantity = (i % 3) + 1; // 1, 2, 3 반복
          return {
            orderId: Number(order.id),
            optionId: Number(option.id),
            quantity,
          };
        }),
      );

      // When: 100명이 동시에 재고 차감 요청
      const results = await Promise.allSettled(
        orders.map(({ orderId, optionId, quantity }) =>
          inventoryDomainService.deductStock(optionId, quantity, orderId),
        ),
      );

      // Then: 성공한 요청들의 차감량 합계 계산
      const succeededResults = results.filter(
        (r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled',
      );
      const totalDeducted = succeededResults.reduce(
        (sum, r) => sum + r.value.deductedQuantity,
        0,
      );

      // 최종 재고 확인
      const finalOption = await prisma.product_options.findUnique({
        where: { id: option.id },
      });

      // 초기 재고 - 최종 재고 = 차감된 총량
      const stockDecreased = initialStock - (finalOption?.stock_quantity ?? 0);
      expect(stockDecreased).toBe(totalDeducted);

      // 재고는 음수가 될 수 없음
      expect(finalOption?.stock_quantity).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('트랜잭션 없이 직접 Repository 호출 시에도 동시성 제어가 작동해야 함', async () => {
      // Given: 재고 100개인 상품 옵션
      const product = await fixture.createProduct({
        productName: 'Repository 직접 호출 테스트',
      });

      const option = await fixture.createProductOption({
        productId: product.id,
        optionName: '그린/M',
        stockQuantity: 100,
      });

      // When: Repository를 직접 호출하여 100명이 동시에 재고 차감
      const results = await Promise.allSettled(
        Array.from({ length: 100 }, (_, i) =>
          productOptionRepository.deductStock(Number(option.id), 1, i + 1),
        ),
      );

      // Then: 정확히 100개 성공
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;

      expect(succeeded).toBe(100);

      // 최종 재고는 0
      const finalOption = await prisma.product_options.findUnique({
        where: { id: option.id },
      });
      expect(finalOption?.stock_quantity).toBe(0);
    }, 30000);
  });

  describe('에러 처리', () => {
    it('존재하지 않는 옵션에 대한 재고 차감은 실패해야 함', async () => {
      // Given: 존재하지 않는 옵션 ID
      const nonExistentOptionId = 999999;

      // When & Then: 재고 차감 시도하면 에러 발생
      await expect(
        inventoryDomainService.deductStock(nonExistentOptionId, 1, 1),
      ).rejects.toThrow();
    });

    it('0개 또는 음수 수량 차감은 실패해야 함', async () => {
      // Given: 정상 상품 옵션
      const product = await fixture.createProduct();
      const option = await fixture.createProductOption({
        productId: product.id,
        stockQuantity: 100,
      });

      // When & Then: 0개 차감 시도
      await expect(
        inventoryDomainService.deductStock(Number(option.id), 0, 1),
      ).rejects.toThrow();

      // When & Then: 음수 차감 시도
      await expect(
        inventoryDomainService.deductStock(Number(option.id), -1, 1),
      ).rejects.toThrow();
    });

    it('재고보다 많은 수량 차감은 실패해야 함', async () => {
      // Given: 재고 10개인 옵션
      const product = await fixture.createProduct();
      const option = await fixture.createProductOption({
        productId: product.id,
        stockQuantity: 10,
      });

      // When & Then: 11개 차감 시도
      await expect(
        inventoryDomainService.deductStock(Number(option.id), 11, 1),
      ).rejects.toThrow();
    });
  });
});
