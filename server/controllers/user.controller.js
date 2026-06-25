import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, req.user, 'Profile loaded');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile({ user: req.user, data: req.body });
  return ApiResponse.ok(res, user, 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });
  return ApiResponse.ok(res, result, 'Password changed. Please sign in again on other devices.');
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await userService.updateAvatar({ user: req.user, file: req.file });
  return ApiResponse.ok(res, user, 'Avatar updated');
});
