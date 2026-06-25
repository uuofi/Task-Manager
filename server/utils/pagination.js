/**
 * Parses common pagination + sorting query params into a normalized shape,
 * with safe bounds so clients can't request unbounded result sets.
 *
 * @param {object} query Express req.query
 * @param {object} [options]
 * @param {number} [options.defaultLimit=20]
 * @param {number} [options.maxLimit=100]
 * @param {string} [options.defaultSort='-createdAt']
 * @returns {{ page: number, limit: number, skip: number, sort: string }}
 */
export const parsePagination = (query = {}, options = {}) => {
  const { defaultLimit = 20, maxLimit = 100, defaultSort = '-createdAt' } = options;

  let page = Number.parseInt(query.page, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let limit = Number.parseInt(query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  limit = Math.min(limit, maxLimit);

  const sort = typeof query.sort === 'string' && query.sort.trim() ? query.sort : defaultSort;

  return { page, limit, skip: (page - 1) * limit, sort };
};

export default parsePagination;
