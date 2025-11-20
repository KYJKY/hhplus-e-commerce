import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  CreateOrderUseCase,
  GetOrderListUseCase,
  GetOrderDetailUseCase,
  ChangeOrderStatusUseCase,
  ProcessOrderPaymentUseCase,
  CompleteOrderUseCase,
  GetOrderStatisticsUseCase,
} from '../application/use-cases';
import {
  CreateOrderRequestDto,
  ProcessPaymentRequestDto,
  ChangeOrderStatusRequestDto,
  GetOrderListQueryDto,
  OrderResponseDto,
  OrderListResponseDto,
  OrderDetailResponseDto,
  ProcessPaymentResponseDto,
  ChangeOrderStatusResponseDto,
  CompleteOrderResponseDto,
  OrderStatisticsResponseDto,
} from './dtos';

@ApiTags('Order')
@Controller('/orders')
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderListUseCase: GetOrderListUseCase,
    private readonly getOrderDetailUseCase: GetOrderDetailUseCase,
    private readonly changeOrderStatusUseCase: ChangeOrderStatusUseCase,
    private readonly processOrderPaymentUseCase: ProcessOrderPaymentUseCase,
    private readonly completeOrderUseCase: CompleteOrderUseCase,
    private readonly getOrderStatisticsUseCase: GetOrderStatisticsUseCase,
  ) {}

  /**
   * FR-O-001: 주문 생성
   * POST /orders
   */
  @Post()
  @ApiOperation({
    summary: '주문 생성',
    description: '장바구니 항목을 기반으로 주문을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '주문 생성 성공',
    type: OrderResponseDto,
  })
  async createOrder(
    @Body() dto: CreateOrderRequestDto,
  ): Promise<OrderResponseDto> {
    const result = await this.createOrderUseCase.execute(
      dto.userId,
      dto.cartItemIds,
      dto.addressId,
      dto.userCouponId,
    );
    return OrderResponseDto.from(result);
  }

  /**
   * FR-O-002: 주문 목록 조회
   * GET /orders/users/:userId
   */
  @Get('users/:userId')
  @ApiOperation({
    summary: '주문 목록 조회',
    description: '사용자의 주문 목록을 조회합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: OrderListResponseDto,
  })
  async getOrderList(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: GetOrderListQueryDto,
  ): Promise<OrderListResponseDto> {
    const result = await this.getOrderListUseCase.execute(
      userId,
      query.status,
      query.page,
      query.size,
    );
    return OrderListResponseDto.from(result);
  }

  /**
   * FR-O-003: 주문 상세 조회
   * GET /orders/:orderId/users/:userId
   */
  @Get(':orderId/users/:userId')
  @ApiOperation({
    summary: '주문 상세 조회',
    description: '특정 주문의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'orderId', description: '주문 ID', type: Number })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: OrderDetailResponseDto,
  })
  async getOrderDetail(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<OrderDetailResponseDto> {
    const result = await this.getOrderDetailUseCase.execute(userId, orderId);
    return OrderDetailResponseDto.from(result);
  }

  /**
   * FR-O-004: 주문 상태 변경 (내부 API)
   * PATCH /orders/:orderId/status
   */
  @Patch(':orderId/status')
  @ApiOperation({
    summary: '주문 상태 변경',
    description: '주문 상태를 변경합니다 (내부 API).',
  })
  @ApiParam({ name: 'orderId', description: '주문 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '상태 변경 성공',
    type: ChangeOrderStatusResponseDto,
  })
  async changeOrderStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: ChangeOrderStatusRequestDto,
  ): Promise<ChangeOrderStatusResponseDto> {
    const result = await this.changeOrderStatusUseCase.execute(
      orderId,
      dto.status,
      dto.reason,
    );
    return ChangeOrderStatusResponseDto.from(result);
  }

  /**
   * FR-O-005: 주문 결제 처리
   * POST /orders/:orderId/payment
   */
  @Post(':orderId/payment')
  @ApiOperation({
    summary: '주문 결제 처리',
    description: '주문에 대한 결제를 처리합니다.',
  })
  @ApiParam({ name: 'orderId', description: '주문 ID', type: Number })
  @ApiResponse({
    status: 201,
    description: '결제 처리 성공',
    type: ProcessPaymentResponseDto,
  })
  async processPayment(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: ProcessPaymentRequestDto,
  ): Promise<ProcessPaymentResponseDto> {
    const result = await this.processOrderPaymentUseCase.execute(
      dto.userId,
      orderId,
    );
    return ProcessPaymentResponseDto.from(result);
  }

  /**
   * FR-O-006: 주문 완료 처리 (내부 API)
   * POST /orders/:orderId/complete
   */
  @Post(':orderId/complete')
  @ApiOperation({
    summary: '주문 완료 처리',
    description: '주문을 완료 상태로 변경합니다 (내부 API).',
  })
  @ApiParam({ name: 'orderId', description: '주문 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '완료 처리 성공',
    type: CompleteOrderResponseDto,
  })
  async completeOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<CompleteOrderResponseDto> {
    const result = await this.completeOrderUseCase.execute(orderId);
    return CompleteOrderResponseDto.from(result);
  }

  /**
   * FR-O-009: 주문 통계 조회
   * GET /orders/users/:userId/statistics
   */
  @Get('users/:userId/statistics')
  @ApiOperation({
    summary: '주문 통계 조회',
    description: '사용자의 주문 통계를 조회합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: OrderStatisticsResponseDto,
  })
  async getOrderStatistics(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<OrderStatisticsResponseDto> {
    const result = await this.getOrderStatisticsUseCase.execute(userId);
    return OrderStatisticsResponseDto.from(result);
  }
}
