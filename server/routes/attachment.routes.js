import { Router } from 'express';
import { param } from 'express-validator';

import * as attachmentController from '../controllers/attachment.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.delete(
  '/:id',
  validate([param('id').isMongoId()]),
  attachmentController.deleteAttachment,
);

export default router;
