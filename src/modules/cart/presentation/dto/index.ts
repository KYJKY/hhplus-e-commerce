/**
 * Cart Presentation DTOs
 *
 * 권장 사용법:
 * - Request DTOs: import { AddCartItemRequestDto } from './requests'
 * - Response DTOs: import { GetCartResponseDto } from './responses'
 *
 * 또는 직접 import:
 * - import { AddCartItemRequestDto } from './requests/add-cart-item.request.dto'
 */

// Request DTOs
export * from './requests';

// Response DTOs
export * from './responses';

/**
 * Note: cart.dto.ts는 하위 호환성을 위해 파일로 유지되지만,
 * export 충돌을 방지하기 위해 여기서는 export하지 않습니다.
 * 필요시 직접 './cart.dto'에서 import 가능합니다.
 */
