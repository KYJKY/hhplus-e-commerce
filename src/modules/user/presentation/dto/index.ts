// Legacy exports (backward compatibility)
export {
  GetUserResponseDto,
  GetProfileResponseDto,
  UpdateProfileRequestDto,
  UpdateProfileResponseDto,
} from './user.dto';
export {
  GetAddressListResponseDto,
  GetAddressDetailResponseDto,
  CreateAddressRequestDto,
  CreateAddressResponseDto,
  UpdateAddressRequestDto,
  UpdateAddressResponseDto,
  DeleteAddressResponseDto,
  SetDefaultAddressResponseDto,
  GetDefaultAddressResponseDto,
} from './user-address.dto';

// New structure exports - Request DTOs
export * from './requests/update-profile.request';
export * from './requests/create-address.request';
export * from './requests/update-address.request';

// New structure exports - Response DTOs
export * from './responses/get-user.response';
export * from './responses/get-profile.response';
export * from './responses/update-profile.response';
export * from './responses/get-address-list.response';
export * from './responses/get-address-detail.response';
export * from './responses/create-address.response';
export * from './responses/update-address.response';
export * from './responses/delete-address.response';
export * from './responses/set-default-address.response';
export * from './responses/get-default-address.response';
