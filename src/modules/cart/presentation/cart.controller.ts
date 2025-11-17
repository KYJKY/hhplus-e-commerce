import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  GetCartUseCase,
  AddCartItemUseCase,
  UpdateCartItemQuantityUseCase,
  DeleteCartItemUseCase,
  DeleteSelectedCartItemsUseCase,
  ClearCartUseCase,
  GetCartItemCountUseCase,
  CheckCartStockUseCase,
} from '../application/use-cases';
import {
  GetCartResponseDto,
  AddCartItemRequestDto,
  AddCartItemResponseDto,
  UpdateCartItemQuantityRequestDto,
  UpdateCartItemQuantityResponseDto,
  RemoveCartItemResponseDto,
  RemoveMultipleCartItemsRequestDto,
  RemoveMultipleCartItemsResponseDto,
  ClearCartResponseDto,
  GetCartItemCountResponseDto,
  CheckCartStockResponseDto,
} from './dto';

@ApiTags('Cart')
@Controller('/cart')
export class CartController {
  constructor(
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addCartItemUseCase: AddCartItemUseCase,
    private readonly updateCartItemQuantityUseCase: UpdateCartItemQuantityUseCase,
    private readonly deleteCartItemUseCase: DeleteCartItemUseCase,
    private readonly deleteSelectedCartItemsUseCase: DeleteSelectedCartItemsUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly getCartItemCountUseCase: GetCartItemCountUseCase,
    private readonly checkCartStockUseCase: CheckCartStockUseCase,
  ) {}

  /**
   * FR-C-001: 장바구니 조회
   * GET /cart/:userId
   */
  @Get(':userId')
  @ApiOperation({
    summary: '장바구니 조회',
    description:
      '사용자의 장바구니를 조회합니다. 상품 정보와 재고 상태를 포함합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: GetCartResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getCart(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GetCartResponseDto> {
    return await this.getCartUseCase.execute(userId);
  }

  /**
   * FR-C-002: 장바구니 아이템 추가
   * POST /cart/:userId/items
   */
  @Post(':userId/items')
  @ApiOperation({
    summary: '장바구니에 아이템 추가',
    description:
      '장바구니에 새 아이템을 추가하거나, 이미 존재하는 옵션인 경우 수량을 증가시킵니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 201,
    description: '추가 성공',
    type: AddCartItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 장바구니 아이템 개수 초과 (최대 20개)',
  })
  @ApiResponse({
    status: 404,
    description: '사용자 또는 상품 옵션을 찾을 수 없음',
  })
  @HttpCode(HttpStatus.CREATED)
  async addCartItem(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() requestDto: AddCartItemRequestDto,
  ): Promise<AddCartItemResponseDto> {
    return await this.addCartItemUseCase.execute(
      userId,
      requestDto.productOptionId,
      requestDto.quantity,
    );
  }

  /**
   * FR-C-003: 장바구니 아이템 수량 수정
   * PATCH /cart/:userId/items/:cartItemId
   */
  @Patch(':userId/items/:cartItemId')
  @ApiOperation({
    summary: '장바구니 아이템 수량 수정',
    description: '장바구니 아이템의 수량을 변경합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiParam({
    name: 'cartItemId',
    description: '장바구니 아이템 ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '수정 성공',
    type: UpdateCartItemQuantityResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 수량 (1-99)' })
  @ApiResponse({ status: 403, description: '접근 권한이 없음' })
  @ApiResponse({ status: 404, description: '장바구니 아이템을 찾을 수 없음' })
  async updateCartItemQuantity(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('cartItemId', ParseIntPipe) cartItemId: number,
    @Body() requestDto: UpdateCartItemQuantityRequestDto,
  ): Promise<UpdateCartItemQuantityResponseDto> {
    return await this.updateCartItemQuantityUseCase.execute(
      userId,
      cartItemId,
      requestDto.quantity,
    );
  }

  /**
   * FR-C-004: 장바구니 아이템 삭제
   * DELETE /cart/:userId/items/:cartItemId
   */
  @Delete(':userId/items/:cartItemId')
  @ApiOperation({
    summary: '장바구니 아이템 삭제',
    description: '장바구니에서 특정 아이템을 삭제합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiParam({
    name: 'cartItemId',
    description: '장바구니 아이템 ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '삭제 성공',
    type: RemoveCartItemResponseDto,
  })
  @ApiResponse({ status: 403, description: '접근 권한이 없음' })
  @ApiResponse({ status: 404, description: '장바구니 아이템을 찾을 수 없음' })
  async removeCartItem(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('cartItemId', ParseIntPipe) cartItemId: number,
  ): Promise<RemoveCartItemResponseDto> {
    return await this.deleteCartItemUseCase.execute(userId, cartItemId);
  }

  /**
   * FR-C-005: 여러 장바구니 아이템 삭제
   * DELETE /cart/:userId/items
   */
  @Delete(':userId/items')
  @ApiOperation({
    summary: '여러 장바구니 아이템 삭제',
    description: '장바구니에서 여러 아이템을 한 번에 삭제합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '삭제 성공',
    type: RemoveMultipleCartItemsResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '접근 권한이 없음' })
  @ApiResponse({
    status: 404,
    description: '일부 장바구니 아이템을 찾을 수 없음',
  })
  async removeMultipleCartItems(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() requestDto: RemoveMultipleCartItemsRequestDto,
  ): Promise<RemoveMultipleCartItemsResponseDto> {
    return await this.deleteSelectedCartItemsUseCase.execute(
      userId,
      requestDto.cartItemIds,
    );
  }

  /**
   * FR-C-006: 장바구니 비우기
   * DELETE /cart/:userId
   */
  @Delete(':userId')
  @ApiOperation({
    summary: '장바구니 비우기',
    description: '사용자의 장바구니에서 모든 아이템을 삭제합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '삭제 성공',
    type: ClearCartResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async clearCart(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ClearCartResponseDto> {
    return await this.clearCartUseCase.execute(userId);
  }

  /**
   * FR-C-007: 장바구니 아이템 수 조회
   * GET /cart/:userId/count
   */
  @Get(':userId/count')
  @ApiOperation({
    summary: '장바구니 아이템 수 조회',
    description: '사용자 장바구니의 총 아이템 개수를 조회합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: GetCartItemCountResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getCartItemCount(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GetCartItemCountResponseDto> {
    return await this.getCartItemCountUseCase.execute(userId);
  }

  /**
   * FR-C-009: 장바구니 재고 확인
   * GET /cart/:userId/stock
   */
  @Get(':userId/stock')
  @ApiOperation({
    summary: '장바구니 재고 확인',
    description:
      '장바구니의 모든 아이템에 대한 재고 가용성을 확인합니다. 구매 불가능한 아이템을 식별합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '확인 성공',
    type: CheckCartStockResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async checkCartAvailability(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<CheckCartStockResponseDto> {
    return await this.checkCartStockUseCase.execute(userId);
  }
}
