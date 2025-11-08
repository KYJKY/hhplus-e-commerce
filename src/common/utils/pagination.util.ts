import type { PaginationMeta } from '../types';

/**
 * 페이지네이션 관련 유틸리티
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * 페이지네이션 메타데이터 생성
 */
export function createPaginationMeta(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * 페이지네이션 오프셋 계산
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * 페이지네이션 파라미터 검증
 */
export function validatePaginationParams(
  page: number,
  limit: number,
): { isValid: boolean; error?: string } {
  if (page < 1) {
    return { isValid: false, error: 'Page must be greater than 0' };
  }

  if (limit < 1 || limit > 100) {
    return { isValid: false, error: 'Limit must be between 1 and 100' };
  }

  return { isValid: true };
}
