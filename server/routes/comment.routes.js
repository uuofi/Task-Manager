import { Router } from 'express';

import * as commentController from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadComment } from '../middleware/context.js';
import { validate } from '../middleware/validate.js';
import {
  commentIdValidator,
  reactValidator,
  updateCommentValidator,
} from '../validators/comment.validator.js';

const router = Router();

router.use(authenticate);

router.patch(
  '/:commentId',
  validate(updateCommentValidator),
  loadComment(),
  commentController.updateComment,
);
router.delete(
  '/:commentId',
  validate(commentIdValidator),
  loadComment(),
  commentController.deleteComment,
);
router.post(
  '/:commentId/react',
  validate(reactValidator),
  loadComment(),
  commentController.reactToComment,
);

export default router;
