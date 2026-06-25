import { dashboardService } from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard({ workspace: req.workspace, user: req.user });
  return ApiResponse.ok(res, data, 'Dashboard loaded');
});
