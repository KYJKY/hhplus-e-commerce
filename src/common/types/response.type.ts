/**
 * 공통 API 응답 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  timestamp: string;
}

/**
 * 에러 응답 타입
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 페이지네이션 메타데이터
 */
export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * 페이지네이션 응답 타입
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
