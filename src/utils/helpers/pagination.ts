// utils/helpers/pagination.ts
export function buildPagination(page: number, limit: number, maxLimit = 100) {
  const safeLimit = Math.min(limit, maxLimit);
  const skip = (page - 1) * safeLimit;
  return { skip, limit: safeLimit };
}