import { Router } from 'express';

import { ApiResponse } from '../utils/ApiResponse.js';

import activityRoutes from './activity.routes.js';
import attachmentRoutes from './attachment.routes.js';
import authRoutes from './auth.routes.js';
import commentRoutes from './comment.routes.js';
import contactRoutes from './contact.routes.js';
import contractLinkRoutes from './contractLink.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import invitationRoutes from './invitation.routes.js';
import notificationRoutes from './notification.routes.js';
import projectRoutes from './project.routes.js';
import searchRoutes from './search.routes.js';
import suggestionRoutes from './suggestion.routes.js';
import taskRoutes from './task.routes.js';
import userRoutes from './user.routes.js';
import workspaceRoutes from './workspace.routes.js';

/**
 * Root API router. Feature routers are mounted here under the versioned prefix.
 */
const router = Router();

router.get('/health', (_req, res) =>
  ApiResponse.ok(res, { status: 'ok', uptime: process.uptime() }, 'API is healthy'),
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/invitations', invitationRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity', activityRoutes);
router.use('/search', searchRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/contract-links', contractLinkRoutes);
router.use('/contact', contactRoutes);

export default router;
