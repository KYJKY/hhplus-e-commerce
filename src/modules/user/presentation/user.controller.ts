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
import { UserService } from '../application/user.service';
import {
  GetUserResponseDto,
  GetProfileResponseDto,
  UpdateProfileRequestDto,
  UpdateProfileResponseDto,
} from './dto/user.dto';
import {
  GetAddressListResponseDto,
  GetAddressDetailResponseDto,
  CreateAddressRequestDto,
  CreateAddressResponseDto,
  UpdateAddressRequestDto,
  UpdateAddressResponseDto,
  DeleteAddressResponseDto,
  SetDefaultAddressResponseDto,
  GetDefaultAddressResponseDto,
  AddressDto,
} from './dto/user-address.dto';

@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * FR-U-001: 사용자 조회
   * GET /user/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: '사용자 조회',
    description: '사용자 ID로 사용자 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: GetUserResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetUserResponseDto> {
    const user = await this.userService.getUserById(id);
    return {
      userId: user.id,
      email: user.email,
      profile: {
        name: user.name,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
      },
      createdAt: user.createdAt,
    };
  }

  /**
   * FR-U-002: 프로필 조회
   * GET /user/:id/profile
   */
  @Get(':id/profile')
  @ApiOperation({
    summary: '프로필 조회',
    description: '사용자의 프로필 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: GetProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetProfileResponseDto> {
    const user = await this.userService.getProfile(id);
    return {
      userId: user.id,
      name: user.name,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * FR-U-003: 프로필 수정
   * PATCH /user/:id/profile
   */
  @Patch(':id/profile')
  @ApiOperation({
    summary: '프로필 수정',
    description: '사용자의 프로필 정보를 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '수정 성공',
    type: UpdateProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateProfileRequestDto,
  ): Promise<UpdateProfileResponseDto> {
    const user = await this.userService.updateProfile(id, updateData);
    return {
      userId: user.id,
      name: user.name,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      updatedAt: user.updatedAt!,
    };
  }

  /**
   * FR-U-004: 배송지 목록 조회
   * GET /user/:id/address
   */
  @Get(':id/address')
  @ApiOperation({
    summary: '배송지 목록 조회',
    description: '사용자의 모든 배송지를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: GetAddressListResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getAddressList(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetAddressListResponseDto> {
    const addresses = await this.userService.getAddressList(id);
    return {
      userId: id,
      addresses: addresses.map((addr) => ({
        addressId: addr.id,
        recipientName: addr.recipientName,
        recipientPhone: addr.recipientPhone,
        postalCode: addr.postalCode,
        addressDefaultText: addr.addressDefaultText,
        addressDetailText: addr.addressDetailText,
        isDefault: addr.isDefault,
        createdAt: addr.createdAt,
      })),
    };
  }

  /**
   * FR-U-005: 배송지 상세 조회
   * GET /user/:id/address/:addressId
   */
  @Get(':id/address/:addressId')
  @ApiOperation({
    summary: '배송지 상세 조회',
    description: '특정 배송지의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiParam({ name: 'addressId', description: '배송지 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: GetAddressDetailResponseDto,
  })
  @ApiResponse({ status: 403, description: '접근 권한이 없음' })
  @ApiResponse({ status: 404, description: '배송지를 찾을 수 없음' })
  async getAddressDetail(
    @Param('id', ParseIntPipe) id: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ): Promise<GetAddressDetailResponseDto> {
    const address = await this.userService.getAddressDetail(id, addressId);
    return {
      addressId: address.id,
      userId: address.userId,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      postalCode: address.postalCode,
      addressDefaultText: address.addressDefaultText,
      addressDetailText: address.addressDetailText,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }

  /**
   * FR-U-006: 배송지 추가
   * POST /user/:id/address
   */
  @Post(':id/address')
  @ApiOperation({
    summary: '배송지 추가',
    description: '새로운 배송지를 등록합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 201,
    description: '생성 성공',
    type: CreateAddressResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 최대 배송지 개수 초과',
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @HttpCode(HttpStatus.CREATED)
  async createAddress(
    @Param('id', ParseIntPipe) id: number,
    @Body() createData: CreateAddressRequestDto,
  ): Promise<CreateAddressResponseDto> {
    const address = await this.userService.createAddress(id, createData);
    return {
      addressId: address.id,
      userId: address.userId,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      postalCode: address.postalCode,
      addressDefaultText: address.addressDefaultText,
      addressDetailText: address.addressDetailText,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
    };
  }

  /**
   * FR-U-007: 배송지 수정
   * PATCH /user/:id/address/:addressId
   */
  @Patch(':id/address/:addressId')
  @ApiOperation({
    summary: '배송지 수정',
    description: '기존 배송지 정보를 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiParam({ name: 'addressId', description: '배송지 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '수정 성공',
    type: UpdateAddressResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '접근 권한이 없음' })
  @ApiResponse({ status: 404, description: '배송지를 찾을 수 없음' })
  async updateAddress(
    @Param('id', ParseIntPipe) id: number,
    @Param('addressId', ParseIntPipe) addressId: number,
    @Body() updateData: UpdateAddressRequestDto,
  ): Promise<UpdateAddressResponseDto> {
    const address = await this.userService.updateAddress(
      id,
      addressId,
      updateData,
    );
    return {
      addressId: address.id,
      userId: address.userId,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      postalCode: address.postalCode,
      addressDefaultText: address.addressDefaultText,
      addressDetailText: address.addressDetailText,
      isDefault: address.isDefault,
      updatedAt: address.updatedAt!,
    };
  }

  /**
   * FR-U-008: 배송지 삭제
   * DELETE /user/:id/address/:addressId
   */
  @Delete(':id/address/:addressId')
  @ApiOperation({ summary: '배송지 삭제', description: '배송지를 삭제합니다.' })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiParam({ name: 'addressId', description: '배송지 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '삭제 성공',
    type: DeleteAddressResponseDto,
  })
  @ApiResponse({ status: 403, description: '접근 권한이 없음' })
  @ApiResponse({ status: 404, description: '배송지를 찾을 수 없음' })
  async deleteAddress(
    @Param('id', ParseIntPipe) id: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ): Promise<DeleteAddressResponseDto> {
    await this.userService.deleteAddress(id, addressId);
    return {
      success: true,
      deletedAddressId: addressId,
    };
  }

  /**
   * FR-U-009: 기본 배송지 설정
   * PATCH /user/:id/address/:addressId/default
   */
  @Patch(':id/address/:addressId/default')
  @ApiOperation({
    summary: '기본 배송지 설정',
    description: '특정 배송지를 기본 배송지로 설정합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiParam({ name: 'addressId', description: '배송지 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '설정 성공',
    type: SetDefaultAddressResponseDto,
  })
  @ApiResponse({ status: 403, description: '접근 권한이 없음' })
  @ApiResponse({ status: 404, description: '배송지를 찾을 수 없음' })
  async setDefaultAddress(
    @Param('id', ParseIntPipe) id: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ): Promise<SetDefaultAddressResponseDto> {
    await this.userService.setDefaultAddress(id, addressId);
    return {
      addressId: addressId,
      success: true,
    };
  }

  /**
   * FR-U-010: 기본 배송지 조회
   * GET /user/:id/address/default
   */
  @Get(':id/address/default')
  @ApiOperation({
    summary: '기본 배송지 조회',
    description: '사용자의 기본 배송지를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: GetDefaultAddressResponseDto,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getDefaultAddress(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetDefaultAddressResponseDto | null> {
    const address = await this.userService.getDefaultAddress(id);
    if (!address) {
      return null;
    }
    return {
      addressId: address.id,
      userId: address.userId,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      postalCode: address.postalCode,
      addressDefaultText: address.addressDefaultText,
      addressDetailText: address.addressDetailText,
      isDefault: address.isDefault,
    };
  }
}
