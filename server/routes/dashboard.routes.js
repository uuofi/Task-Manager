import { Router } from 'express';

import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadWorkspace } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate, loadWorkspace);
router.get('/', dashboardController.getDashboard);
router.get('/team', dashboardController.getTeamAnalytics);

export default router;
