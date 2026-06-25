import { attachmentService } from '../services/attachment.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadTaskAttachment = asyncHandler(async (req, res) => {
  const attachment = await attachmentService.uploadToTask({
    task: req.task,
    user: req.user,
    file: req.file,
  });
  return ApiResponse.created(res, attachment, 'File attached');
});

export const listTaskAttachments = asyncHandler(async (req, res) => {
  const attachments = await attachmentService.listByTask(req.task.id);
  return ApiResponse.ok(res, attachments, 'Attachments loaded');
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  const result = await attachmentService.remove({ attachmentId: req.params.id, user: req.user });
  return ApiResponse.ok(res, result, 'Attachment deleted');
});
