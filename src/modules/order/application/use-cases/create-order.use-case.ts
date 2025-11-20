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
import { CartDomainService } from '../../../cart/domain/services/cart-domain.service';
import { UserDomainService } from '../../../user/domain/services/user-domain.service';
import { ProductQueryService } from '../../../product/domain/services/product-query.service';
import { InventoryDomainService } from '../../../product/domain/services/inventory-domain.service';
import { CouponDomainService } from '../../../coupon/domain/services/coupon-domain.service';

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
    private readonly cartDomainService: CartDomainService,
    private readonly userDomainService: UserDomainService,
    private readonly productQueryService: ProductQueryService,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly couponDomainService: CouponDomainService,
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

    // 2. 장바구니 항목 조회 및 권한 확인
    const cartItems =
      await this.cartDomainService.findCartItemsByIdsWithAuthorization(
        userId,
        cartItemIds,
      );

    if (cartItems.length !== cartItemIds.length) {
      throw new CartItemNotFoundException(
        cartItemIds.filter(
          (id) => !cartItems.some((item) => item.id === id),
        )[0],
      );
    }

    // 3. 배송지 조회 및 권한 확인
    const address = await this.userDomainService.findAddressWithAuthorization(
      userId,
      addressId,
    );

    // 배송지 스냅샷 생성
    const shippingAddress = ShippingAddress.create(
      address.recipientName,
      address.recipientPhone,
      address.postalCode,
      address.addressDefaultText,
      address.addressDetailText ?? '',
    );

    // 4. 상품 및 재고 확인, 주문 항목 생성
    const orderItems: OrderItem[] = [];

    for (const cartItem of cartItems) {
      // 상품 옵션 조회
      const optionDetail =
        await this.productQueryService.getProductOptionDetail(
          cartItem.productId,
          cartItem.productOptionId,
        );

      // 재고 확인
      if (!optionDetail.isAvailable) {
        throw new OptionNotAvailableException(cartItem.productOptionId);
      }

      const stockCheck = await this.inventoryDomainService.checkStock(
        cartItem.productOptionId,
        cartItem.quantity,
      );

      if (!stockCheck.isAvailable) {
        throw new InsufficientStockException(
          cartItem.productOptionId,
          cartItem.quantity,
          stockCheck.currentStock,
        );
      }

      // 주문 항목 생성 (가격 스냅샷)
      const orderItem = OrderItem.create(
        0, // orderId는 주문 생성 후 설정
        cartItem.productId,
        optionDetail.productName,
        cartItem.productOptionId,
        optionDetail.optionName,
        cartItem.quantity,
        optionDetail.price,
      );

      orderItems.push(orderItem);
    }

    // 5. 금액 계산
    const subtotalAmount = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    let discountAmount = 0;
    let appliedCoupon: AppliedCouponDto | null = null;
    let appliedCouponId: number | null = null;

    // 6. 쿠폰 적용 (선택적)
    if (userCouponId) {
      const validationResult = await this.couponDomainService.validateCoupon(
        userId,
        userCouponId,
        subtotalAmount,
      );

      if (!validationResult.isValid) {
        throw new InvalidCouponException(userCouponId);
      }

      discountAmount = validationResult.discountAmount;

      // 쿠폰 정보 조회
      const userCoupon =
        await this.couponDomainService.findUserCouponById(userCouponId);
      const coupon = await this.couponDomainService.findCouponById(
        userCoupon.couponId,
      );

      appliedCoupon = {
        couponId: coupon.id,
        couponName: coupon.couponName,
        discountRate: coupon.discountRate,
      };
      appliedCouponId = coupon.id;
    }

    const totalAmount = subtotalAmount - discountAmount;

    // 7. 주문번호 생성
    const today = new Date();
    const todayOrderCount = await this.orderRepository.countTodayOrders();
    const orderNumber = Order.generateOrderNumber(today, todayOrderCount + 1);

    // 8. 주문 생성
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

    // 9. 주문 저장
    const savedOrder = await this.orderRepository.save(order);

    // 10. 응답 반환
    return this.orderMapper.toOrderDto(savedOrder, appliedCoupon);
  }
}
