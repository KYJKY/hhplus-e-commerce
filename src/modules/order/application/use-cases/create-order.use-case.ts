import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { ShippingAddress } from '../../domain/value-objects/shipping-address.vo';
import {
  CartItemIdsEmptyException,
  CartItemNotFoundException,
  AddressNotFoundException,
  AddressAccessDeniedException,
  OptionNotFoundException,
  OptionNotAvailableException,
  InsufficientStockException,
  InvalidCouponException,
} from '../../domain/exceptions/order.exception';
import { CreateOrderResultDto, AppliedCouponDto } from '../dtos/order.dto';
import { OrderMapper } from '../mappers/order.mapper';

/**
 * FR-O-001: 주문 생성
 *
 * 장바구니 항목을 기반으로 주문을 생성합니다.
 * - 재고 확인 (재고 차감은 결제 시점에 수행)
 * - 쿠폰 유효성 검증
 * - 가격 및 배송지 스냅샷
 */
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly orderMapper: OrderMapper,
    // TODO: 다음 모듈들의 서비스를 inject해야 합니다:
    // - ICartRepository (장바구니 항목 조회)
    // - IUserRepository (배송지 조회)
    // - IProductRepository (상품 및 재고 확인)
    // - CouponDomainService (쿠폰 검증)
  ) {}

  async execute(
    userId: number,
    cartItemIds: number[],
    addressId: number,
    userCouponId?: number,
  ): Promise<CreateOrderResultDto> {
    // 1. 입력 검증
    if (!cartItemIds || cartItemIds.length === 0) {
      throw new CartItemIdsEmptyException();
    }

    // 2. 장바구니 항목 조회
    // TODO: Cart 모듈에서 장바구니 항목 조회
    // const cartItems = await this.cartRepository.findByIds(cartItemIds, userId);
    // if (cartItems.length !== cartItemIds.length) {
    //   throw new CartItemNotFoundException(...);
    // }

    // 3. 배송지 조회
    // TODO: User 모듈에서 배송지 조회
    // const address = await this.userRepository.findAddressById(addressId);
    // if (!address) {
    //   throw new AddressNotFoundException(addressId);
    // }
    // if (address.userId !== userId) {
    //   throw new AddressAccessDeniedException(addressId, userId);
    // }

    // 임시 배송지 (TODO 제거 후 삭제)
    const shippingAddress = ShippingAddress.create(
      '홍길동',
      '010-1234-5678',
      '12345',
      '서울시 강남구',
      '101동 101호',
    );

    // 4. 상품 및 재고 확인
    // TODO: Product 모듈에서 각 항목의 상품 옵션 및 재고 확인
    // for (const cartItem of cartItems) {
    //   const option = await this.productRepository.findOptionById(cartItem.optionId);
    //   if (!option) {
    //     throw new OptionNotFoundException(cartItem.optionId);
    //   }
    //   if (!option.isAvailableForSale) {
    //     throw new OptionNotAvailableException(cartItem.optionId);
    //   }
    //   if (option.stockQuantity < cartItem.quantity) {
    //     throw new InsufficientStockException(
    //       cartItem.optionId,
    //       cartItem.quantity,
    //       option.stockQuantity,
    //     );
    //   }
    // }

    // 5. 주문 항목 생성 (가격 스냅샷)
    // TODO: 실제 장바구니 항목에서 생성
    const orderItems: OrderItem[] = [];
    // for (const cartItem of cartItems) {
    //   const option = await this.productRepository.findOptionById(cartItem.optionId);
    //   const item = OrderItem.create(
    //     0, // orderId는 주문 생성 후 설정
    //     cartItem.productId,
    //     cartItem.productName,
    //     cartItem.optionId,
    //     option.optionName,
    //     cartItem.quantity,
    //     option.price,
    //   );
    //   orderItems.push(item);
    // }

    // 6. 금액 계산
    const subtotalAmount = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    let discountAmount = 0;
    let appliedCoupon: AppliedCouponDto | null = null;
    let appliedCouponId: number | null = null;

    // 7. 쿠폰 적용 (선택적)
    if (userCouponId) {
      // TODO: Coupon 모듈에서 쿠폰 검증
      // const validationResult = await this.couponDomainService.validateCoupon(
      //   userId,
      //   userCouponId,
      //   subtotalAmount,
      // );
      // if (!validationResult.isValid) {
      //   throw new InvalidCouponException(userCouponId);
      // }
      // discountAmount = validationResult.discountAmount;
      // appliedCoupon = {
      //   couponId: validationResult.couponId,
      //   couponName: validationResult.couponName,
      //   discountRate: validationResult.discountRate,
      // };
      // appliedCouponId = validationResult.couponId;
    }

    const totalAmount = subtotalAmount - discountAmount;

    // 8. 주문번호 생성
    const today = new Date();
    const todayOrderCount = await this.orderRepository.countTodayOrders();
    const orderNumber = Order.generateOrderNumber(today, todayOrderCount + 1);

    // 9. 주문 생성
    const order = Order.create(
      userId,
      orderNumber,
      orderItems,
      shippingAddress,
      subtotalAmount,
      discountAmount,
      totalAmount,
      appliedCouponId,
      userCouponId ?? null,
    );

    // 10. 주문 저장
    const savedOrder = await this.orderRepository.save(order);

    // 11. 응답 반환
    return this.orderMapper.toOrderDto(savedOrder, appliedCoupon);
  }
}
