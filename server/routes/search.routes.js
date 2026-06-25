import { Router } from 'express';

import * as searchController from '../controllers/search.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadWorkspace } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate, loadWorkspace);
router.get('/', searchController.globalSearch);

export default router;
