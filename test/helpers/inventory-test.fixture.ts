import { PrismaClient } from '@prisma/client';

/**
 * 재고 테스트 픽스처
 *
 * 테스트에 필요한 샘플 데이터 생성
 * - 사용자 데이터
 * - 상품 데이터
 * - 상품 옵션 데이터 (재고 포함)
 * - 주문 데이터
 */
export class InventoryTestFixture {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 테스트 사용자 생성
   */
  async createUser(data?: {
    loginId?: string;
    email?: string;
    name?: string;
    point?: number;
  }) {
    return await this.prisma.users.create({
      data: {
        login_id: data?.loginId ?? 'testuser',
        login_password: 'password123',
        email: data?.email ?? 'test@example.com',
        name: data?.name ?? '테스트유저',
        display_name: '테스터',
        phone_number: '010-1234-5678',
        point: String(data?.point ?? 100000),
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * 테스트 상품 생성
   */
  async createProduct(data?: {
    productName?: string;
    description?: string;
    isActive?: boolean;
  }) {
    return await this.prisma.products.create({
      data: {
        product_name: data?.productName ?? '테스트 상품',
        product_description: data?.description ?? '테스트용 상품입니다',
        is_active: data?.isActive ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * 테스트 상품 옵션 생성 (재고 포함)
   */
  async createProductOption(data: {
    productId: bigint;
    optionName?: string;
    priceAmount?: number;
    stockQuantity?: number;
    isAvailable?: boolean;
  }) {
    return await this.prisma.product_options.create({
      data: {
        product_id: data.productId,
        option_name: data.optionName ?? '블랙/L',
        option_description: '기본 옵션',
        price_amount: data.priceAmount ?? 50000,
        stock_quantity: data.stockQuantity ?? 100,
        is_available: data.isAvailable ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * 테스트 주문 생성
   */
  async createOrder(data: {
    userId: bigint;
    orderNumber?: string;
    totalAmount?: number;
    orderStatus?: string;
  }) {
    return await this.prisma.orders.create({
      data: {
        user_id: data.userId,
        order_number: data.orderNumber ?? `ORD${Date.now()}`,
        order_status: data.orderStatus ?? 'PENDING',
        recipient_name: '홍길동',
        recipient_phone: '010-1234-5678',
        shipping_postal_code: '12345',
        shipping_address: '서울시 강남구',
        shipping_address_detail: '123호',
        subtotal_amount: data.totalAmount ?? 100000,
        discount_amount: 0,
        total_amount: data.totalAmount ?? 100000,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * 테스트 주문 항목 생성
   */
  async createOrderItem(data: {
    orderId: bigint;
    productId: bigint;
    productOptionId: bigint;
    productName: string;
    optionName: string;
    quantity: number;
    unitPrice: number;
  }) {
    return await this.prisma.order_items.create({
      data: {
        order_id: data.orderId,
        product_id: data.productId,
        product_option_id: data.productOptionId,
        product_name: data.productName,
        option_name: data.optionName,
        quantity: data.quantity,
        unit_price: data.unitPrice,
        subtotal: data.unitPrice * data.quantity,
      },
    });
  }

  /**
   * 상품, 옵션, 주문을 한 번에 생성하는 헬퍼
   */
  async createProductWithOptionAndOrder(data?: {
    userId?: bigint;
    stockQuantity?: number;
    quantity?: number;
    priceAmount?: number;
  }) {
    // 사용자가 없으면 생성
    const user = data?.userId
      ? await this.prisma.users.findUnique({
          where: { id: data.userId },
        })
      : await this.createUser();

    if (!user) {
      throw new Error('User not found');
    }

    // 상품 생성
    const product = await this.createProduct();

    // 상품 옵션 생성 (재고 포함)
    const option = await this.createProductOption({
      productId: product.id,
      stockQuantity: data?.stockQuantity ?? 100,
      priceAmount: data?.priceAmount ?? 50000,
    });

    // 주문 생성
    const quantity = data?.quantity ?? 1;
    const order = await this.createOrder({
      userId: user.id,
      totalAmount: Number(option.price_amount) * quantity,
    });

    // 주문 항목 생성
    await this.createOrderItem({
      orderId: order.id,
      productId: product.id,
      productOptionId: option.id,
      productName: product.product_name,
      optionName: option.option_name,
      quantity,
      unitPrice: Number(option.price_amount),
    });

    return {
      user,
      product,
      option,
      order,
    };
  }
}
