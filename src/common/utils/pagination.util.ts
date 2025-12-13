/**
 * Pagination utility for building consistent paginated responses
 * Used across all modules that return lists (students, content, homework, etc.)
 */

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Build a paginated result object with metadata
 *
 * @param data - Array of items for the current page
 * @param total - Total number of items across all pages
 * @param params - Pagination parameters (page, limit)
 * @returns PaginatedResult with data and meta
 *
 * @example
 * const result = buildPaginatedResult(
 *   students,
 *   100,
 *   { page: 2, limit: 10 }
 * );
 * // Returns:
 * // {
 * //   data: [...students],
 * //   meta: { page: 2, limit: 10, total: 100, totalPages: 10 }
 * // }
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.limit) || 1;

  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
    },
  };
}

/**
 * Calculate skip value for Prisma queries
 *
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @returns Number of items to skip
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
