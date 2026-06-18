export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Safely parse pagination query params with max-limit enforcement.
 * Prevents negative page numbers and excessively large limits.
 */
export function parsePagination(queryPage?: string, queryLimit?: string): PaginationParams {
  let page = parseInt(queryPage || '1', 10);
  let limit = parseInt(queryLimit || String(DEFAULT_LIMIT), 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
