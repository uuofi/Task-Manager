import { suggestionService } from '../services/suggestion.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';

export const createSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await suggestionService.create({
    workspace: req.workspace,
    user: req.user,
    data: req.body,
  });
  return ApiResponse.created(res, suggestion, 'Suggestion sent');
});

export const listReceived = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, total } = await suggestionService.listReceived({
    workspace: req.workspace,
    user: req.user,
    status: req.query.status,
    pagination,
  });
  return ApiResponse.ok(res, items, 'Received suggestions', ApiResponse.paginate({ ...pagination, total }));
});

export const listSent = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, total } = await suggestionService.listSent({
    workspace: req.workspace,
    user: req.user,
    status: req.query.status,
    pagination,
  });
  return ApiResponse.ok(res, items, 'Sent suggestions', ApiResponse.paginate({ ...pagination, total }));
});

export const acceptSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await suggestionService.accept({
    suggestionId: req.params.id,
    workspace: req.workspace,
    user: req.user,
    projectId: req.body.projectId,
  });
  return ApiResponse.ok(res, suggestion, 'Suggestion accepted');
});

export const rejectSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await suggestionService.reject({
    suggestionId: req.params.id,
    workspace: req.workspace,
    user: req.user,
    note: req.body.note,
  });
  return ApiResponse.ok(res, suggestion, 'Suggestion declined');
});
