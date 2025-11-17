import { CartItem } from '../entities/cart-item.entity';

/**
 * CartItem Repository 인터페이스
 *
 * 장바구니 항목 데이터 접근 계층 추상화
 */
export interface ICartItemRepository {
  /**
   * ID로 장바구니 항목 조회
   */
  findById(id: number): Promise<CartItem | null>;

  /**
   * 사용자의 장바구니 항목 목록 조회 (삭제되지 않은 항목만)
   */
  findByUserId(userId: number): Promise<CartItem[]>;

  /**
   * 사용자와 상품 옵션으로 장바구니 항목 조회 (삭제되지 않은 항목만)
   * UNIQUE(user_id, product_option_id) 제약 조건 활용
   */
  findByUserAndOption(
    userId: number,
    optionId: number,
  ): Promise<CartItem | null>;

  /**
   * 여러 ID로 장바구니 항목 조회 (삭제되지 않은 항목만)
   */
  findByIds(ids: number[]): Promise<CartItem[]>;

  /**
   * 장바구니 항목 생성
   */
  save(cartItem: Omit<CartItem, 'id'>): Promise<CartItem>;

  /**
   * 장바구니 항목 수정
   */
  update(id: number, updates: Partial<CartItem>): Promise<CartItem>;

  /**
   * 장바구니 항목 삭제 (논리적 삭제)
   */
  delete(id: number): Promise<void>;

  /**
   * 여러 장바구니 항목 삭제 (논리적 삭제)
   * @returns 삭제된 항목 수
   */
  deleteByIds(ids: number[]): Promise<number>;

  /**
   * 사용자의 모든 장바구니 항목 삭제 (논리적 삭제)
   * @returns 삭제된 항목 수
   */
  deleteAllByUserId(userId: number): Promise<number>;

  /**
   * 사용자의 장바구니 항목 개수 조회 (삭제되지 않은 항목만)
   */
  countByUserId(userId: number): Promise<number>;

  /**
   * 장바구니 항목 존재 여부 확인
   */
  exists(id: number): Promise<boolean>;
}
