import { activityService } from '../services/activity.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';

export const listActivity = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultLimit: 30 });
  const { items, total } = await activityService.list({
    workspace: req.workspace.id,
    project: req.query.projectId,
    task: req.query.taskId,
    pagination,
  });
  return ApiResponse.ok(res, items, 'Activity loaded', ApiResponse.paginate({ ...pagination, total }));
});
