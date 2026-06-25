import { Router } from 'express';

import * as suggestionController from '../controllers/suggestion.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadWorkspace } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  acceptSuggestionValidator,
  createSuggestionValidator,
  rejectSuggestionValidator,
} from '../validators/suggestion.validator.js';

const router = Router();

router.use(authenticate, loadWorkspace);

router.post('/', validate(createSuggestionValidator), suggestionController.createSuggestion);
router.get('/received', suggestionController.listReceived);
router.get('/sent', suggestionController.listSent);
router.post('/:id/accept', validate(acceptSuggestionValidator), suggestionController.acceptSuggestion);
router.post('/:id/reject', validate(rejectSuggestionValidator), suggestionController.rejectSuggestion);

export default router;
