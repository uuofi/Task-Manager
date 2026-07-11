import { Router } from 'express';

import * as contactController from '../controllers/contact.controller.js';
import { contactLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { contactValidator } from '../validators/contact.validator.js';

const router = Router();

router.post('/', contactLimiter, validate(contactValidator), contactController.submitContact);

export default router;
