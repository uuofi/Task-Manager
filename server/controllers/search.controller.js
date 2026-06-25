import { searchService } from '../services/search.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const globalSearch = asyncHandler(async (req, res) => {
  const query = (req.query.q || '').toString();
  if (query.trim().length < 2) {
    throw ApiError.badRequest('Search query must be at least 2 characters');
  }
  const types = req.query.type ? req.query.type.toString().split(',') : null;

  const results = await searchService.search({ workspace: req.workspace, query, types });
  return ApiResponse.ok(res, results, 'Search results');
});
