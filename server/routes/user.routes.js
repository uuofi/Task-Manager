import { Router } from 'express';

import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadAvatar } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { changePasswordValidator, updateProfileValidator } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileValidator), userController.updateProfile);
router.patch('/me/password', validate(changePasswordValidator), userController.changePassword);
router.post('/me/avatar', uploadAvatar, userController.uploadAvatar);

export default router;
