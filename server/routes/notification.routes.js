import { Router } from 'express';

import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.listNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
