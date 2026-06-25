import { Router } from 'express';

import * as attachmentController from '../controllers/attachment.controller.js';
import * as commentController from '../controllers/comment.controller.js';
import * as taskController from '../controllers/task.controller.js';
import * as timerController from '../controllers/timer.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadWorkspace } from '../middleware/authorize.js';
import { loadProject, loadTask } from '../middleware/context.js';
import { uploadSingle } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { createCommentValidator } from '../validators/comment.validator.js';
import {
  checklistAddValidator,
  checklistItemValidator,
  createTaskValidator,
  dependencyValidator,
  moveTaskValidator,
  taskIdValidator,
  updateTaskValidator,
} from '../validators/task.validator.js';

const router = Router();

router.use(authenticate);

// Create (project derived from body.projectId) + list (workspace-scoped).
router.post('/', validate(createTaskValidator), loadProject(), taskController.createTask);
router.get('/', loadWorkspace, taskController.listTasks);

// Board for a project.
router.get('/board/:projectId', loadProject(), taskController.getBoard);

// Single task.
router.get('/:taskId', validate(taskIdValidator), loadTask(), taskController.getTask);
router.patch('/:taskId', validate(updateTaskValidator), loadTask(), taskController.updateTask);
router.patch('/:taskId/move', validate(moveTaskValidator), loadTask(), taskController.moveTask);
router.delete('/:taskId', validate(taskIdValidator), loadTask(), taskController.deleteTask);

// Checklist.
router.post(
  '/:taskId/checklist',
  validate(checklistAddValidator),
  loadTask(),
  taskController.addChecklistItem,
);
router.patch(
  '/:taskId/checklist/:itemId',
  validate(checklistItemValidator),
  loadTask(),
  taskController.toggleChecklistItem,
);
router.delete(
  '/:taskId/checklist/:itemId',
  validate(checklistItemValidator),
  loadTask(),
  taskController.removeChecklistItem,
);

// Dependencies.
router.post(
  '/:taskId/dependencies',
  validate(dependencyValidator),
  loadTask(),
  taskController.addDependency,
);
router.delete(
  '/:taskId/dependencies/:dependsOnId',
  validate(taskIdValidator),
  loadTask(),
  taskController.removeDependency,
);

// Comments (task-scoped create + list).
router.get('/:taskId/comments', validate(taskIdValidator), loadTask(), commentController.listComments);
router.post(
  '/:taskId/comments',
  validate(createCommentValidator),
  loadTask(),
  commentController.createComment,
);

// Attachments (task-scoped upload + list).
router.get(
  '/:taskId/attachments',
  validate(taskIdValidator),
  loadTask(),
  attachmentController.listTaskAttachments,
);
router.post(
  '/:taskId/attachments',
  loadTask(),
  uploadSingle('file'),
  attachmentController.uploadTaskAttachment,
);

// Timer.
router.get('/:taskId/timer', validate(taskIdValidator), loadTask(), timerController.getActiveTimer);
router.get('/:taskId/timer/entries', validate(taskIdValidator), loadTask(), timerController.listTaskTime);
router.post('/:taskId/timer/start', validate(taskIdValidator), loadTask(), timerController.startTimer);
router.post('/:taskId/timer/pause', validate(taskIdValidator), loadTask(), timerController.pauseTimer);
router.post('/:taskId/timer/resume', validate(taskIdValidator), loadTask(), timerController.resumeTimer);
router.post('/:taskId/timer/stop', validate(taskIdValidator), loadTask(), timerController.stopTimer);

export default router;
