import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  GetProductListUseCase,
  GetProductDetailUseCase,
  GetProductOptionsUseCase,
  GetProductOptionDetailUseCase,
  CheckStockUseCase,
  DeductStockUseCase,
  RestoreStockUseCase,
  GetPopularProductsUseCase,
  GetCategoriesUseCase,
  GetCategoryProductCountUseCase,
} from '../application/use-cases';
import {
  GetProductListRequest,
  GetProductListResponse,
  GetProductDetailResponse,
  GetProductOptionsResponse,
  GetProductOptionDetailResponse,
  CheckStockRequest,
  CheckStockResponse,
  DeductStockRequest,
  DeductStockResponse,
  RestoreStockRequest,
  RestoreStockResponse,
  GetPopularProductsResponse,
  GetCategoriesResponse,
  GetCategoryProductCountResponse,
} from './dto';

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(
    private readonly getProductListUseCase: GetProductListUseCase,
    private readonly getProductDetailUseCase: GetProductDetailUseCase,
    private readonly getProductOptionsUseCase: GetProductOptionsUseCase,
    private readonly getProductOptionDetailUseCase: GetProductOptionDetailUseCase,
    private readonly checkStockUseCase: CheckStockUseCase,
    private readonly deductStockUseCase: DeductStockUseCase,
    private readonly restoreStockUseCase: RestoreStockUseCase,
    private readonly getPopularProductsUseCase: GetPopularProductsUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
    private readonly getCategoryProductCountUseCase: GetCategoryProductCountUseCase,
  ) {}

  /**
   * FR-P-001: 상품 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '상품 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '상품 목록 조회 성공',
    type: GetProductListResponse,
  })
  async getProductList(
    @Query() query: GetProductListRequest,
  ): Promise<GetProductListResponse> {
    return await this.getProductListUseCase.execute(query);
  }

  /**
   * FR-P-002: 상품 상세 조회
   */
  @Get(':productId')
  @ApiOperation({ summary: '상품 상세 조회' })
  @ApiParam({ name: 'productId', description: '상품 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '상품 상세 조회 성공',
    type: GetProductDetailResponse,
  })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음 (P001)' })
  @ApiResponse({ status: 410, description: '삭제된 상품 (P002)' })
  async getProductDetail(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<GetProductDetailResponse> {
    return await this.getProductDetailUseCase.execute(productId);
  }

  /**
   * FR-P-003: 상품 옵션 조회
   */
  @Get(':productId/options')
  @ApiOperation({ summary: '상품 옵션 조회' })
  @ApiParam({ name: 'productId', description: '상품 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '상품 옵션 조회 성공',
    type: GetProductOptionsResponse,
  })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음 (P001)' })
  async getProductOptions(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<GetProductOptionsResponse> {
    return await this.getProductOptionsUseCase.execute(productId);
  }

  /**
   * FR-P-004: 상품 옵션 상세 조회
   */
  @Get(':productId/options/:optionId')
  @ApiOperation({ summary: '상품 옵션 상세 조회' })
  @ApiParam({ name: 'productId', description: '상품 ID', example: 1 })
  @ApiParam({ name: 'optionId', description: '옵션 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '상품 옵션 상세 조회 성공',
    type: GetProductOptionDetailResponse,
  })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음 (P001)' })
  @ApiResponse({ status: 404, description: '옵션을 찾을 수 없음 (P003)' })
  @ApiResponse({
    status: 400,
    description: '옵션이 해당 상품에 속하지 않음 (P004)',
  })
  async getProductOptionDetail(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('optionId', ParseIntPipe) optionId: number,
  ): Promise<GetProductOptionDetailResponse> {
    return await this.getProductOptionDetailUseCase.execute(
      productId,
      optionId,
    );
  }

  /**
   * FR-P-005: 재고 확인
   */
  @Post('options/:optionId/check-stock')
  @ApiOperation({ summary: '재고 확인' })
  @ApiParam({ name: 'optionId', description: '옵션 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '재고 확인 성공',
    type: CheckStockResponse,
  })
  @ApiResponse({ status: 404, description: '옵션을 찾을 수 없음 (P003)' })
  async checkStock(
    @Param('optionId', ParseIntPipe) optionId: number,
    @Body() body: CheckStockRequest,
  ): Promise<CheckStockResponse> {
    return await this.checkStockUseCase.execute(optionId, body.quantity);
  }

  /**
   * FR-P-006: 재고 차감 (내부 API)
   */
  @Post('options/:optionId/deduct-stock')
  @ApiOperation({ summary: '재고 차감 (내부 API)' })
  @ApiParam({ name: 'optionId', description: '옵션 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '재고 차감 성공',
    type: DeductStockResponse,
  })
  @ApiResponse({ status: 404, description: '옵션을 찾을 수 없음 (P003)' })
  @ApiResponse({ status: 400, description: '재고 부족 (P005)' })
  @ApiResponse({ status: 400, description: '유효하지 않은 수량 (P006)' })
  async deductStock(
    @Param('optionId', ParseIntPipe) optionId: number,
    @Body() body: DeductStockRequest,
  ): Promise<DeductStockResponse> {
    return await this.deductStockUseCase.execute(
      optionId,
      body.quantity,
      body.orderId,
    );
  }

  /**
   * FR-P-007: 재고 복원 (내부 API)
   */
  @Post('options/:optionId/restore-stock')
  @ApiOperation({ summary: '재고 복원 (내부 API)' })
  @ApiParam({ name: 'optionId', description: '옵션 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '재고 복원 성공',
    type: RestoreStockResponse,
  })
  @ApiResponse({ status: 404, description: '옵션을 찾을 수 없음 (P003)' })
  @ApiResponse({ status: 400, description: '유효하지 않은 수량 (P006)' })
  async restoreStock(
    @Param('optionId', ParseIntPipe) optionId: number,
    @Body() body: RestoreStockRequest,
  ): Promise<RestoreStockResponse> {
    return await this.restoreStockUseCase.execute(
      optionId,
      body.quantity,
      body.orderId,
    );
  }

  /**
   * FR-P-008: 인기 상품 조회 (Top 5)
   */
  @Get('popular/top5')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800000) // 30분 (30 * 60 * 1000ms)
  @ApiOperation({ summary: '인기 상품 조회 (Top 5)' })
  @ApiResponse({
    status: 200,
    description: '인기 상품 조회 성공',
    type: GetPopularProductsResponse,
  })
  async getPopularProducts(): Promise<GetPopularProductsResponse> {
    return await this.getPopularProductsUseCase.execute();
  }

  /**
   * FR-P-009: 카테고리 목록 조회
   */
  @Get('categories/list')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800000) // 30분 (30 * 60 * 1000ms)
  @ApiOperation({ summary: '카테고리 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '카테고리 목록 조회 성공',
    type: GetCategoriesResponse,
  })
  async getCategories(): Promise<GetCategoriesResponse> {
    return await this.getCategoriesUseCase.execute();
  }

  /**
   * FR-P-010: 카테고리별 상품 수 조회
   */
  @Get('categories/:categoryId/product-count')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800000) // 30분 (30 * 60 * 1000ms)
  @ApiOperation({ summary: '카테고리별 상품 수 조회' })
  @ApiParam({ name: 'categoryId', description: '카테고리 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '카테고리별 상품 수 조회 성공',
    type: GetCategoryProductCountResponse,
  })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없음 (P007)' })
  async getCategoryProductCount(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<GetCategoryProductCountResponse> {
    return await this.getCategoryProductCountUseCase.execute(categoryId);
  }
}
