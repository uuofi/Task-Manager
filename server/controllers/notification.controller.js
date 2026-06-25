import { notificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultLimit: 20 });
  const { items, total, unreadCount } = await notificationService.list({
    recipient: req.user.id,
    unreadOnly: req.query.unread === 'true',
    pagination,
  });
  return ApiResponse.ok(res, items, 'Notifications loaded', {
    ...ApiResponse.paginate({ ...pagination, total }),
    unreadCount,
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.countUnread(req.user.id);
  return ApiResponse.ok(res, { count }, 'Unread count');
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user.id);
  return ApiResponse.ok(res, notification, 'Marked as read');
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  return ApiResponse.ok(res, null, 'All notifications marked as read');
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.remove(req.params.id, req.user.id);
  return ApiResponse.ok(res, null, 'Notification removed');
});
