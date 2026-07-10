import { Router } from 'express';

import * as contractLinkController from '../controllers/contractLink.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadWorkspace } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  contractLinkIdValidator,
  toggleContractLinkValidator,
} from '../validators/contractLink.validator.js';

const router = Router();

router.use(authenticate, loadWorkspace);

router.get('/', contractLinkController.listContractLinks);
router.post('/', validate(toggleContractLinkValidator), contractLinkController.toggleContractLink);
router.delete('/:id', validate(contractLinkIdValidator), contractLinkController.removeContractLink);

export default router;
