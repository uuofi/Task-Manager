import { Router } from 'express';

import * as activityController from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadWorkspace } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// Workspace-scoped activity feed, optionally filtered by project/task.
router.get('/', loadWorkspace, activityController.listActivity);

export default router;
