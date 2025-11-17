import { Quantity } from '../value-objects/quantity.vo';
import { InvalidQuantityException } from '../exceptions';

/**
 * CartItem 생성 속성
 */
export interface CreateCartItemProps {
  id: number;
  userId: number;
  productId: number;
  productOptionId: number;
  quantity: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * CartItem 도메인 엔티티
 *
 * Value Object 사용:
 * - Quantity: 수량 검증 (1~99)
 *
 * 비즈니스 규칙:
 * - 수량 범위: 1~99
 * - 논리적 삭제(soft delete) 지원
 * - UNIQUE(user_id, product_option_id)
 */
export class CartItem {
  private constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly productId: number,
    public readonly productOptionId: number,
    private _quantity: Quantity,
    private _deletedAt: string | null,
    public readonly createdAt: string,
    private _updatedAt: string | null,
  ) {}

  /**
   * 수량 반환 (기존 코드 호환)
   */
  get quantity(): number {
    return this._quantity.getValue();
  }

  /**
   * 삭제 시각 반환
   */
  get deletedAt(): string | null {
    return this._deletedAt;
  }

  /**
   * 수정 시각 반환
   */
  get updatedAt(): string | null {
    return this._updatedAt;
  }

  /**
   * Quantity VO 반환
   */
  getQuantityVO(): Quantity {
    return this._quantity;
  }

  /**
   * CartItem 엔티티 생성 팩토리 메서드
   * VO를 생성하여 검증을 VO에 위임
   */
  static create(props: CreateCartItemProps): CartItem {
    try {
      // VO 생성 (검증은 VO 내부에서 수행)
      const quantity = Quantity.create(props.quantity);

      return new CartItem(
        props.id,
        props.userId,
        props.productId,
        props.productOptionId,
        quantity,
        props.deletedAt ?? null,
        props.createdAt,
        props.updatedAt ?? null,
      );
    } catch (error) {
      // VO 검증 실패 시 도메인 예외로 변환
      if (error instanceof Error && error.message.includes('Quantity')) {
        throw new InvalidQuantityException(props.quantity);
      }
      throw error;
    }
  }

  /**
   * 수량 변경
   * @param newQuantity - 변경할 수량 (1~99)
   */
  updateQuantity(newQuantity: number): void {
    try {
      this._quantity = Quantity.create(newQuantity);
      this._updatedAt = new Date().toISOString();
    } catch (error) {
      // VO 검증 실패 시 도메인 예외로 변환
      if (error instanceof Error && error.message.includes('Quantity')) {
        throw new InvalidQuantityException(newQuantity);
      }
      throw error;
    }
  }

  /**
   * 수량 증가
   * @param amount - 증가할 수량
   */
  increaseQuantity(amount: number): void {
    try {
      this._quantity = this._quantity.add(amount);
      this._updatedAt = new Date().toISOString();
    } catch (error) {
      // VO 검증 실패 시 도메인 예외로 변환
      if (error instanceof Error && error.message.includes('Quantity')) {
        throw new InvalidQuantityException(this._quantity.getValue() + amount);
      }
      throw error;
    }
  }

  /**
   * 수량 감소
   * @param amount - 감소할 수량
   */
  decreaseQuantity(amount: number): void {
    try {
      this._quantity = this._quantity.subtract(amount);
      this._updatedAt = new Date().toISOString();
    } catch (error) {
      // VO 검증 실패 시 도메인 예외로 변환
      if (error instanceof Error && error.message.includes('Quantity')) {
        throw new InvalidQuantityException(this._quantity.getValue() - amount);
      }
      throw error;
    }
  }

  /**
   * 논리적 삭제
   */
  delete(): void {
    this._deletedAt = new Date().toISOString();
    this._updatedAt = new Date().toISOString();
  }

  /**
   * 삭제 여부 확인
   */
  isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  /**
   * 소유자 확인
   * @param userId - 사용자 ID
   */
  isOwnedBy(userId: number): boolean {
    return this.userId === userId;
  }

  /**
   * 최대 수량 여부 확인
   */
  isMaxQuantity(): boolean {
    return this._quantity.isMaxQuantity();
  }
}
