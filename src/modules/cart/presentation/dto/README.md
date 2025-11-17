# Cart Presentation DTOs

Cart 모듈의 HTTP 계층 DTO 정의

## 디렉토리 구조

```
dto/
├── requests/              # HTTP 요청 DTO
│   ├── add-cart-item.request.dto.ts
│   ├── update-cart-item-quantity.request.dto.ts
│   ├── remove-multiple-cart-items.request.dto.ts
│   └── index.ts
├── responses/             # HTTP 응답 DTO
│   ├── cart-item.response.dto.ts
│   ├── get-cart.response.dto.ts
│   ├── add-cart-item.response.dto.ts
│   ├── update-cart-item-quantity.response.dto.ts
│   ├── remove-cart-item.response.dto.ts
│   ├── remove-multiple-cart-items.response.dto.ts
│   ├── clear-cart.response.dto.ts
│   ├── get-cart-item-count.response.dto.ts
│   ├── cart-stock-item.response.dto.ts
│   ├── check-cart-stock.response.dto.ts
│   └── index.ts
├── cart.dto.ts           # Deprecated - 하위 호환성 유지용
├── index.ts
└── README.md

## DTO 분류

### Request DTOs (요청)

HTTP 요청 바디와 쿼리 파라미터 검증에 사용되는 DTO

| DTO | 파일 | 용도 |
|-----|------|------|
| `AddCartItemRequestDto` | `requests/add-cart-item.request.dto.ts` | 장바구니 항목 추가 요청 |
| `UpdateCartItemQuantityRequestDto` | `requests/update-cart-item-quantity.request.dto.ts` | 장바구니 수량 수정 요청 |
| `RemoveMultipleCartItemsRequestDto` | `requests/remove-multiple-cart-items.request.dto.ts` | 여러 항목 삭제 요청 |

**특징:**
- `class-validator` 데코레이터를 사용한 유효성 검증
- `@ApiProperty`를 통한 Swagger 문서화
- Controller에서 `@Body()`, `@Query()` 등으로 사용

### Response DTOs (응답)

HTTP 응답 형태를 정의하는 DTO

| DTO | 파일 | 용도 |
|-----|------|------|
| `CartItemDto` | `responses/cart-item.response.dto.ts` | 장바구니 항목 정보 (공통) |
| `GetCartResponseDto` | `responses/get-cart.response.dto.ts` | 장바구니 조회 응답 |
| `AddCartItemResponseDto` | `responses/add-cart-item.response.dto.ts` | 장바구니 추가 응답 |
| `UpdateCartItemQuantityResponseDto` | `responses/update-cart-item-quantity.response.dto.ts` | 수량 수정 응답 |
| `RemoveCartItemResponseDto` | `responses/remove-cart-item.response.dto.ts` | 단일 항목 삭제 응답 |
| `RemoveMultipleCartItemsResponseDto` | `responses/remove-multiple-cart-items.response.dto.ts` | 다중 항목 삭제 응답 |
| `ClearCartResponseDto` | `responses/clear-cart.response.dto.ts` | 장바구니 비우기 응답 |
| `GetCartItemCountResponseDto` | `responses/get-cart-item-count.response.dto.ts` | 장바구니 개수 조회 응답 |
| `CartStockItemDto` | `responses/cart-stock-item.response.dto.ts` | 재고 확인 항목 (공통) |
| `CheckCartStockResponseDto` | `responses/check-cart-stock.response.dto.ts` | 재고 확인 응답 |

**특징:**
- `@ApiProperty`를 통한 Swagger 문서화
- Controller의 반환 타입으로 사용
- Application DTO와 분리되어 HTTP 관심사만 포함

## 사용 예시

### Request DTO 사용

```typescript
import { AddCartItemRequestDto } from './requests';

@Controller('cart')
export class CartController {
  @Post('items')
  async addItem(
    @Body() request: AddCartItemRequestDto,
    @GetUserId() userId: number,
  ) {
    // ...
  }
}
```

### Response DTO 사용

```typescript
import { GetCartResponseDto } from './responses';

@Controller('cart')
export class CartController {
  @Get()
  @ApiResponse({ type: GetCartResponseDto })
  async getCart(@GetUserId() userId: number): Promise<GetCartResponseDto> {
    // Application DTO를 받아서 Presentation DTO로 변환
    const cartDto = await this.getCartUseCase.execute(userId);
    return this.mapToResponse(cartDto);
  }
}
```

## 데이터 흐름

```
Client
  ↓ HTTP Request
[Request DTO] ← Validation (class-validator)
  ↓
Controller
  ↓ Use Case 호출
[Application DTO] ← Use Case 실행
  ↓
Controller (Mapping)
  ↓
[Response DTO] → Swagger 문서화
  ↓ HTTP Response
Client
```

## 계층 격리

- **Presentation DTO**: HTTP 요청/응답 형태 정의 (이 디렉토리)
- **Application DTO**: Use Case 입출력 데이터 (`application/dtos/`)
- **Domain Entity**: 비즈니스 로직 및 데이터 (`domain/entities/`)

각 계층의 DTO는 서로 독립적이며, Controller에서 변환 로직을 통해 연결됩니다.

## 마이그레이션 가이드

### 기존 코드 (Deprecated)

```typescript
import { AddCartItemRequestDto } from './cart.dto';
```

### 새로운 코드 (권장)

```typescript
import { AddCartItemRequestDto } from './requests';
// 또는
import { AddCartItemRequestDto } from './requests/add-cart-item.request.dto';
```

`cart.dto.ts`는 하위 호환성을 위해 유지되지만, 새로운 코드에서는 `requests/` 또는 `responses/`를 사용하세요.

## 주의사항

1. **Request DTO는 항상 class-validator 검증을 포함해야 합니다**
   - `@IsNumber()`, `@Min()`, `@Max()` 등
2. **Response DTO는 검증이 불필요합니다**
   - 서버에서 생성하는 데이터이므로
3. **모든 DTO는 @ApiProperty로 문서화되어야 합니다**
   - Swagger 자동 생성을 위해
4. **DTO 이름 규칙:**
   - Request: `{동사}{명사}RequestDto` (예: `AddCartItemRequestDto`)
   - Response: `{동사}{명사}ResponseDto` (예: `GetCartResponseDto`)
