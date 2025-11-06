import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaymentService } from '../application/payment.service';
import {
  GetBalanceResponseDto,
  ChargePointRequestDto,
  ChargePointResponseDto,
  GetPointTransactionsRequestDto,
  GetPointTransactionsResponseDto,
  ProcessPaymentRequestDto,
  ProcessPaymentResponseDto,
  GetPaymentsRequestDto,
  GetPaymentsResponseDto,
  GetPaymentDetailResponseDto,
  ProcessPaymentFailureRequestDto,
  ProcessPaymentFailureResponseDto,
  ValidatePointDeductionRequestDto,
  ValidatePointDeductionResponseDto,
  GetPaymentStatisticsResponseDto,
} from './dto';

@ApiTags('Payment')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * FR-PAY-001: 포인트 잔액 조회
   */
  @Get('users/:userId/balance')
  @ApiOperation({ summary: '포인트 잔액 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '포인트 잔액 조회 성공',
    type: GetBalanceResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음 (U001)' })
  async getBalance(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GetBalanceResponseDto> {
    return await this.paymentService.getBalance(userId);
  }

  /**
   * FR-PAY-002: 포인트 충전
   */
  @Post('users/:userId/charge')
  @ApiOperation({ summary: '포인트 충전' })
  @ApiParam({ name: 'userId', description: '사용자 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '포인트 충전 성공',
    type: ChargePointResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음 (U001)' })
  @ApiResponse({
    status: 400,
    description: '유효하지 않은 충전 금액 (PAY007)',
  })
  @ApiResponse({
    status: 400,
    description: '충전 금액이 1,000원 단위가 아님 (PAY008)',
  })
  @ApiResponse({
    status: 400,
    description: '최대 보유 가능 포인트 초과 (PAY009)',
  })
  async chargePoint(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: ChargePointRequestDto,
  ): Promise<ChargePointResponseDto> {
    return await this.paymentService.chargePoint(userId, body.amount);
  }

  /**
   * FR-PAY-003: 포인트 사용 내역 조회
   */
  @Get('users/:userId/transactions')
  @ApiOperation({ summary: '포인트 사용 내역 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '포인트 사용 내역 조회 성공',
    type: GetPointTransactionsResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음 (U001)' })
  @ApiResponse({
    status: 400,
    description: '유효하지 않은 날짜 범위 (PAY015)',
  })
  async getPointTransactions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: GetPointTransactionsRequestDto,
  ): Promise<GetPointTransactionsResponseDto> {
    return await this.paymentService.getPointTransactions({
      userId,
      ...query,
    });
  }

  /**
   * FR-PAY-004: 결제 처리 (내부 API)
   */
  @Post('users/:userId/process')
  @ApiOperation({ summary: '결제 처리 (내부 API)' })
  @ApiParam({ name: 'userId', description: '사용자 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '결제 처리 성공',
    type: ProcessPaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음 (U001)' })
  @ApiResponse({ status: 400, description: '포인트 잔액 부족 (PAY005)' })
  @ApiResponse({
    status: 400,
    description: '유효하지 않은 결제 금액 (PAY006)',
  })
  @ApiResponse({ status: 409, description: '이미 결제된 주문 (PAY010)' })
  async processPayment(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: ProcessPaymentRequestDto,
  ): Promise<ProcessPaymentResponseDto> {
    return await this.paymentService.processPayment(
      userId,
      body.orderId,
      body.amount,
    );
  }

  /**
   * FR-PAY-005: 결제 내역 조회
   */
  @Get('users/:userId/payments')
  @ApiOperation({ summary: '결제 내역 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '결제 내역 조회 성공',
    type: GetPaymentsResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음 (U001)' })
  async getPayments(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: GetPaymentsRequestDto,
  ): Promise<GetPaymentsResponseDto> {
    return await this.paymentService.getPayments({
      userId,
      ...query,
    });
  }

  /**
   * FR-PAY-006: 결제 상세 조회
   */
  @Get('users/:userId/payments/:paymentId')
  @ApiOperation({ summary: '결제 상세 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID', example: 1 })
  @ApiParam({ name: 'paymentId', description: '결제 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '결제 상세 조회 성공',
    type: GetPaymentDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음 (U001)' })
  @ApiResponse({ status: 404, description: '결제를 찾을 수 없음 (PAY003)' })
  @ApiResponse({
    status: 403,
    description: '해당 결제에 접근 권한이 없음 (PAY004)',
  })
  async getPaymentDetail(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): Promise<GetPaymentDetailResponseDto> {
    return await this.paymentService.getPaymentDetail(userId, paymentId);
  }

  /**
   * FR-PAY-008: 결제 실패 처리 (내부 API)
   */
  @Post('users/:userId/process-failure')
  @ApiOperation({ summary: '결제 실패 처리 (내부 API)' })
  @ApiParam({ name: 'userId', description: '사용자 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '결제 실패 처리 성공',
    type: ProcessPaymentFailureResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음 (U001)' })
  async processPaymentFailure(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: ProcessPaymentFailureRequestDto,
  ): Promise<ProcessPaymentFailureResponseDto> {
    return await this.paymentService.processPaymentFailure(
      userId,
      body.orderId,
      body.amount,
      body.failureReason,
    );
  }

  /**
   * FR-PAY-009: 포인트 차감 검증 (내부 API)
   */
  @Post('users/:userId/validate-deduction')
  @ApiOperation({ summary: '포인트 차감 검증 (내부 API)' })
  @ApiParam({ name: 'userId', description: '사용자 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '포인트 차감 검증 성공',
    type: ValidatePointDeductionResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음 (U001)' })
  @ApiResponse({ status: 400, description: '유효하지 않은 금액 (PAY014)' })
  async validatePointDeduction(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: ValidatePointDeductionRequestDto,
  ): Promise<ValidatePointDeductionResponseDto> {
    return await this.paymentService.validatePointDeduction(
      userId,
      body.amount,
    );
  }

  /**
   * FR-PAY-010: 결제 통계 조회
   */
  @Get('users/:userId/statistics')
  @ApiOperation({ summary: '결제 통계 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '결제 통계 조회 성공',
    type: GetPaymentStatisticsResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음 (U001)' })
  async getPaymentStatistics(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GetPaymentStatisticsResponseDto> {
    return await this.paymentService.getPaymentStatistics(userId);
  }
}
