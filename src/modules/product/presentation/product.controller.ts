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
import { ProductService } from '../application/product.service';
import {
  GetProductListRequestDto,
  GetProductListResponseDto,
  GetProductDetailResponseDto,
  GetProductOptionsResponseDto,
  GetProductOptionDetailResponseDto,
  CheckStockRequestDto,
  CheckStockResponseDto,
  DeductStockRequestDto,
  DeductStockResponseDto,
  RestoreStockRequestDto,
  RestoreStockResponseDto,
  GetPopularProductsResponseDto,
  GetCategoriesResponseDto,
  GetCategoryProductCountResponseDto,
} from './dto';

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * FR-P-001: 상품 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '상품 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '상품 목록 조회 성공',
    type: GetProductListResponseDto,
  })
  async getProductList(
    @Query() query: GetProductListRequestDto,
  ): Promise<GetProductListResponseDto> {
    const result = await this.productService.getProductList(query);
    return result;
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
    type: GetProductDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음 (P001)' })
  @ApiResponse({ status: 410, description: '삭제된 상품 (P002)' })
  async getProductDetail(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<GetProductDetailResponseDto> {
    return await this.productService.getProductDetail(productId);
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
    type: GetProductOptionsResponseDto,
  })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음 (P001)' })
  async getProductOptions(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<GetProductOptionsResponseDto> {
    return await this.productService.getProductOptions(productId);
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
    type: GetProductOptionDetailResponseDto,
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
  ): Promise<GetProductOptionDetailResponseDto> {
    return await this.productService.getProductOptionDetail(
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
    type: CheckStockResponseDto,
  })
  @ApiResponse({ status: 404, description: '옵션을 찾을 수 없음 (P003)' })
  async checkStock(
    @Param('optionId', ParseIntPipe) optionId: number,
    @Body() body: CheckStockRequestDto,
  ): Promise<CheckStockResponseDto> {
    return await this.productService.checkStock(optionId, body.quantity);
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
    type: DeductStockResponseDto,
  })
  @ApiResponse({ status: 404, description: '옵션을 찾을 수 없음 (P003)' })
  @ApiResponse({ status: 400, description: '재고 부족 (P005)' })
  @ApiResponse({ status: 400, description: '유효하지 않은 수량 (P006)' })
  async deductStock(
    @Param('optionId', ParseIntPipe) optionId: number,
    @Body() body: DeductStockRequestDto,
  ): Promise<DeductStockResponseDto> {
    return await this.productService.deductStock(
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
    type: RestoreStockResponseDto,
  })
  @ApiResponse({ status: 404, description: '옵션을 찾을 수 없음 (P003)' })
  @ApiResponse({ status: 400, description: '유효하지 않은 수량 (P006)' })
  async restoreStock(
    @Param('optionId', ParseIntPipe) optionId: number,
    @Body() body: RestoreStockRequestDto,
  ): Promise<RestoreStockResponseDto> {
    return await this.productService.restoreStock(
      optionId,
      body.quantity,
      body.orderId,
    );
  }

  /**
   * FR-P-008: 인기 상품 조회 (Top 5)
   */
  @Get('popular/top5')
  @ApiOperation({ summary: '인기 상품 조회 (Top 5)' })
  @ApiResponse({
    status: 200,
    description: '인기 상품 조회 성공',
    type: GetPopularProductsResponseDto,
  })
  async getPopularProducts(): Promise<GetPopularProductsResponseDto> {
    return await this.productService.getPopularProducts();
  }

  /**
   * FR-P-009: 카테고리 목록 조회
   */
  @Get('categories/list')
  @ApiOperation({ summary: '카테고리 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '카테고리 목록 조회 성공',
    type: GetCategoriesResponseDto,
  })
  async getCategories(): Promise<GetCategoriesResponseDto> {
    const categories = await this.productService.getCategories();
    return { categories };
  }

  /**
   * FR-P-010: 카테고리별 상품 수 조회
   */
  @Get('categories/:categoryId/product-count')
  @ApiOperation({ summary: '카테고리별 상품 수 조회' })
  @ApiParam({ name: 'categoryId', description: '카테고리 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '카테고리별 상품 수 조회 성공',
    type: GetCategoryProductCountResponseDto,
  })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없음 (P007)' })
  async getCategoryProductCount(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<GetCategoryProductCountResponseDto> {
    return await this.productService.getCategoryProductCount(categoryId);
  }
}
