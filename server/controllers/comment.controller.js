import { commentService } from '../services/comment.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.create({
    task: req.task,
    project: req.project,
    workspace: req.workspace,
    user: req.user,
    data: req.body,
  });
  return ApiResponse.created(res, comment, 'Comment posted');
});

export const listComments = asyncHandler(async (req, res) => {
  const comments = await commentService.list(req.task.id);
  return ApiResponse.ok(res, comments, 'Comments loaded');
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentService.update({
    commentId: req.params.commentId,
    user: req.user,
    body: req.body.body,
  });
  return ApiResponse.ok(res, comment, 'Comment updated');
});

export const deleteComment = asyncHandler(async (req, res) => {
  const result = await commentService.remove({
    commentId: req.params.commentId,
    user: req.user,
    role: req.membershipRole,
  });
  return ApiResponse.ok(res, result, 'Comment deleted');
});

export const reactToComment = asyncHandler(async (req, res) => {
  const comment = await commentService.react({
    commentId: req.params.commentId,
    user: req.user,
    emoji: req.body.emoji,
  });
  return ApiResponse.ok(res, comment, 'Reaction updated');
});
