import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  GetAvailableCouponsUseCase,
  GetUserCouponsUseCase,
  GetCouponDetailUseCase,
  IssueCouponUseCase,
  IssueCouponByCodeUseCase,
  ValidateCouponUseCase,
  UseCouponUseCase,
  GetCouponStatisticsUseCase,
} from '../application/use-cases';
import {
  IssueCouponRequestDto,
  IssueCouponByCodeRequestDto,
  ValidateCouponRequestDto,
  UseCouponRequestDto,
  CouponResponseDto,
  AvailableCouponResponseDto,
  UserCouponDetailResponseDto,
  CouponValidationResponseDto,
  CouponStatisticsResponseDto,
} from './dtos';
import { UserCouponStatus } from '../domain/entities/user-coupon.entity';

@ApiTags('Coupon')
@Controller('/coupons')
export class CouponController {
  constructor(
    private readonly getAvailableCouponsUseCase: GetAvailableCouponsUseCase,
    private readonly getUserCouponsUseCase: GetUserCouponsUseCase,
    private readonly getCouponDetailUseCase: GetCouponDetailUseCase,
    private readonly issueCouponUseCase: IssueCouponUseCase,
    private readonly issueCouponByCodeUseCase: IssueCouponByCodeUseCase,
    private readonly validateCouponUseCase: ValidateCouponUseCase,
    private readonly useCouponUseCase: UseCouponUseCase,
    private readonly getCouponStatisticsUseCase: GetCouponStatisticsUseCase,
  ) {}

  /**
   * FR-CP-001: 발급 가능 쿠폰 목록 조회
   * GET /coupons/available
   */
  @Get('available')
  @ApiOperation({
    summary: '발급 가능 쿠폰 목록 조회',
    description: '현재 발급 가능한 쿠폰 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: [AvailableCouponResponseDto],
  })
  async getAvailableCoupons(
    @Query('userId', ParseIntPipe) userId?: number,
  ): Promise<AvailableCouponResponseDto[]> {
    const coupons = await this.getAvailableCouponsUseCase.execute(userId);
    return coupons.map((c) => AvailableCouponResponseDto.from(c));
  }

  /**
   * FR-CP-002: 보유 쿠폰 목록 조회
   * GET /coupons/users/:userId
   */
  @Get('users/:userId')
  @ApiOperation({
    summary: '보유 쿠폰 목록 조회',
    description: '사용자가 보유한 쿠폰 목록을 조회합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: [UserCouponDetailResponseDto],
  })
  async getUserCoupons(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('status') status?: UserCouponStatus,
  ): Promise<UserCouponDetailResponseDto[]> {
    const coupons = await this.getUserCouponsUseCase.execute(userId, status);
    return coupons.map((c) => UserCouponDetailResponseDto.from(c));
  }

  /**
   * FR-CP-003: 쿠폰 상세 조회
   * GET /coupons/:couponId
   */
  @Get(':couponId')
  @ApiOperation({
    summary: '쿠폰 상세 조회',
    description: '특정 쿠폰의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'couponId', description: '쿠폰 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: CouponResponseDto,
  })
  async getCouponDetail(
    @Param('couponId', ParseIntPipe) couponId: number,
  ): Promise<CouponResponseDto> {
    const coupon = await this.getCouponDetailUseCase.execute(couponId);
    return CouponResponseDto.from(coupon);
  }

  /**
   * FR-CP-004: 쿠폰 발급
   * POST /coupons/issue
   */
  @Post('issue')
  @ApiOperation({
    summary: '쿠폰 발급',
    description: '사용자에게 쿠폰을 발급합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '발급 성공',
    type: UserCouponDetailResponseDto,
  })
  async issueCoupon(
    @Body() dto: IssueCouponRequestDto,
  ): Promise<UserCouponDetailResponseDto> {
    const userCoupon = await this.issueCouponUseCase.execute(
      dto.userId,
      dto.couponId,
    );
    return UserCouponDetailResponseDto.from(userCoupon);
  }

  /**
   * FR-CP-005: 쿠폰 코드로 발급
   * POST /coupons/issue/by-code
   */
  @Post('issue/by-code')
  @ApiOperation({
    summary: '쿠폰 코드로 발급',
    description: '쿠폰 코드를 입력하여 쿠폰을 발급받습니다.',
  })
  @ApiResponse({
    status: 201,
    description: '발급 성공',
    type: UserCouponDetailResponseDto,
  })
  async issueCouponByCode(
    @Body() dto: IssueCouponByCodeRequestDto,
  ): Promise<UserCouponDetailResponseDto> {
    const userCoupon = await this.issueCouponByCodeUseCase.execute(
      dto.userId,
      dto.couponCode,
    );
    return UserCouponDetailResponseDto.from(userCoupon);
  }

  /**
   * FR-CP-006: 쿠폰 유효성 검증 (내부 API)
   * POST /coupons/validate
   */
  @Post('validate')
  @ApiOperation({
    summary: '쿠폰 유효성 검증',
    description: '주문 시 쿠폰의 유효성을 검증합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '검증 완료',
    type: CouponValidationResponseDto,
  })
  async validateCoupon(
    @Body() dto: ValidateCouponRequestDto,
  ): Promise<CouponValidationResponseDto> {
    const result = await this.validateCouponUseCase.execute(
      dto.userId,
      dto.userCouponId,
      dto.orderAmount,
    );
    return CouponValidationResponseDto.from(result);
  }

  /**
   * FR-CP-007: 쿠폰 사용 처리 (내부 API)
   * POST /coupons/use
   */
  @Post('use')
  @ApiOperation({
    summary: '쿠폰 사용 처리',
    description: '결제 완료 시 쿠폰을 사용 처리합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용 처리 완료',
  })
  async useCoupon(@Body() dto: UseCouponRequestDto): Promise<void> {
    await this.useCouponUseCase.execute(
      dto.userId,
      dto.userCouponId,
      dto.orderId,
    );
  }

  /**
   * FR-CP-010: 쿠폰 통계 조회
   * GET /coupons/:couponId/statistics
   */
  @Get(':couponId/statistics')
  @ApiOperation({
    summary: '쿠폰 통계 조회',
    description: '특정 쿠폰의 발급 및 사용 통계를 조회합니다.',
  })
  @ApiParam({ name: 'couponId', description: '쿠폰 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: CouponStatisticsResponseDto,
  })
  async getCouponStatistics(
    @Param('couponId', ParseIntPipe) couponId: number,
  ): Promise<CouponStatisticsResponseDto> {
    const statistics = await this.getCouponStatisticsUseCase.execute(couponId);
    return CouponStatisticsResponseDto.from(statistics);
  }
}
