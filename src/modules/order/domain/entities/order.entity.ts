import {
  OrderStatus,
  OrderStatusTransition,
} from '../enums/order-status.enum';
import { ShippingAddress } from '../value-objects/shipping-address.vo';
import { OrderItem } from './order-item.entity';
import { InvalidStatusTransitionException } from '../exceptions/order.exception';

/**
 * 주문 Entity
 */
export class Order {
  private constructor(
    private readonly _id: number,
    private readonly _userId: number,
    private readonly _orderNumber: string,
    private _items: OrderItem[],
    private readonly _shippingAddress: ShippingAddress,
    private readonly _subtotalAmount: number,
    private readonly _discountAmount: number,
    private readonly _totalAmount: number,
    private readonly _appliedCouponId: number | null,
    private readonly _appliedUserCouponId: number | null,
    private _status: OrderStatus,
    private readonly _createdAt: string,
    private _paidAt: string | null,
    private _completedAt: string | null,
    private _updatedAt: string,
  ) {}

  get id(): number {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get orderNumber(): string {
    return this._orderNumber;
  }

  get items(): OrderItem[] {
    return this._items;
  }

  get shippingAddress(): ShippingAddress {
    return this._shippingAddress;
  }

  get subtotalAmount(): number {
    return this._subtotalAmount;
  }

  get discountAmount(): number {
    return this._discountAmount;
  }

  get totalAmount(): number {
    return this._totalAmount;
  }

  get appliedCouponId(): number | null {
    return this._appliedCouponId;
  }

  get appliedUserCouponId(): number | null {
    return this._appliedUserCouponId;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get paidAt(): string | null {
    return this._paidAt;
  }

  get completedAt(): string | null {
    return this._completedAt;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  /**
   * 기존 Order 재구성
   */
  static from(
    id: number,
    userId: number,
    orderNumber: string,
    items: OrderItem[],
    shippingAddress: ShippingAddress,
    subtotalAmount: number,
    discountAmount: number,
    totalAmount: number,
    appliedCouponId: number | null,
    appliedUserCouponId: number | null,
    status: OrderStatus,
    createdAt: string,
    paidAt: string | null,
    completedAt: string | null,
    updatedAt: string,
  ): Order {
    return new Order(
      id,
      userId,
      orderNumber,
      items,
      shippingAddress,
      subtotalAmount,
      discountAmount,
      totalAmount,
      appliedCouponId,
      appliedUserCouponId,
      status,
      createdAt,
      paidAt,
      completedAt,
      updatedAt,
    );
  }

  /**
   * 새로운 Order 생성
   */
  static create(
    userId: number,
    orderNumber: string,
    items: OrderItem[],
    shippingAddress: ShippingAddress,
    subtotalAmount: number,
    discountAmount: number,
    totalAmount: number,
    appliedCouponId: number | null,
    appliedUserCouponId: number | null,
  ): Order {
    // 기본 검증
    if (items.length === 0) {
      throw new Error('Order must have at least one item');
    }
    if (subtotalAmount < 0) {
      throw new Error('Subtotal amount cannot be negative');
    }
    if (discountAmount < 0) {
      throw new Error('Discount amount cannot be negative');
    }
    if (totalAmount < 0) {
      throw new Error('Total amount cannot be negative');
    }
    if (discountAmount > subtotalAmount) {
      throw new Error('Discount amount cannot exceed subtotal amount');
    }

    const now = new Date().toISOString();

    return new Order(
      0, // ID는 저장 시 생성됨
      userId,
      orderNumber,
      items,
      shippingAddress,
      subtotalAmount,
      discountAmount,
      totalAmount,
      appliedCouponId,
      appliedUserCouponId,
      OrderStatus.PENDING,
      now,
      null,
      null,
      now,
    );
  }

  /**
   * 주문번호 생성 (ORD-YYYYMMDD-####)
   */
  static generateOrderNumber(date: Date, sequence: number): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(sequence).padStart(4, '0');
    return `ORD-${year}${month}${day}-${seq}`;
  }

  /**
   * 상태 변경
   */
  changeStatus(newStatus: OrderStatus): void {
    if (!OrderStatusTransition.isValidTransition(this._status, newStatus)) {
      throw new InvalidStatusTransitionException(
        this._id,
        this._status,
        newStatus,
      );
    }

    this._status = newStatus;
    this._updatedAt = new Date().toISOString();

    // 상태별 타임스탬프 기록
    if (newStatus === OrderStatus.PAID) {
      this._paidAt = this._updatedAt;
    } else if (newStatus === OrderStatus.COMPLETED) {
      this._completedAt = this._updatedAt;
    }
  }

  /**
   * 결제 가능한지 확인
   */
  canPay(): boolean {
    return OrderStatusTransition.isPayableStatus(this._status);
  }

  /**
   * 완료 처리 가능한지 확인
   */
  canComplete(): boolean {
    return OrderStatusTransition.isCompletableStatus(this._status);
  }

  /**
   * 최종 상태인지 확인
   */
  isFinalStatus(): boolean {
    return OrderStatusTransition.isFinalStatus(this._status);
  }

  /**
   * 쿠폰이 적용되었는지 확인
   */
  hasCouponApplied(): boolean {
    return this._appliedCouponId !== null && this._appliedUserCouponId !== null;
  }

  /**
   * 주문 항목 수
   */
  get itemCount(): number {
    return this._items.length;
  }

  /**
   * 소유권 검증
   */
  isOwnedBy(userId: number): boolean {
    return this._userId === userId;
  }
}
