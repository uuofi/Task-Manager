import { ROLE_RANK, ROLES } from '../constants/index.js';
import { Workspace } from '../models/Workspace.js';
import { attachmentRepository } from '../repositories/attachment.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { ApiError } from '../utils/ApiError.js';

import { storageService } from './storage.service.js';

/** Saves an uploaded file and links it to a task. */
const uploadToTask = async ({ task, user, file }) => {
  if (!file) throw ApiError.badRequest('No file provided');

  const saved = await storageService.save(file);
  const attachment = await attachmentRepository.create({
    workspace: task.workspace,
    task: task.id,
    uploadedBy: user.id,
    originalName: file.originalname,
    storedName: saved.storedName,
    mimeType: file.mimetype,
    size: file.size,
    url: saved.url,
    storageDriver: saved.driver,
  });

  task.attachments.push(attachment.id);
  await task.save();

  return attachmentRepository.findById(attachment.id).then((a) => a.populate('uploadedBy', 'name avatar'));
};

const listByTask = (taskId) => attachmentRepository.listByTask(taskId);

/** Deletes an attachment (uploader or manager+), removing the stored file. */
const remove = async ({ attachmentId, user }) => {
  const attachment = await attachmentRepository.findById(attachmentId);
  if (!attachment) throw ApiError.notFound('Attachment not found');

  const workspace = await Workspace.findById(attachment.workspace);
  const role = workspace?.getMemberRole(user.id);
  if (!role) throw ApiError.forbidden('You are not a member of this workspace');

  const isUploader = String(attachment.uploadedBy) === String(user.id);
  if (!isUploader && (ROLE_RANK[role] ?? 0) < ROLE_RANK[ROLES.MANAGER]) {
    throw ApiError.forbidden('You can only delete your own attachments');
  }

  await storageService.remove(attachment.storedName);
  if (attachment.task) {
    await taskRepository.updateById(attachment.task, { $pull: { attachments: attachment.id } });
  }
  await attachmentRepository.deleteById(attachment.id);
  return { id: attachment.id };
};

export const attachmentService = { uploadToTask, listByTask, remove };

export default attachmentService;
