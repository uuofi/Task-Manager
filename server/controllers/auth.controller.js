import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../utils/cookies.js';

/**
 * Thin HTTP layer over `authService`. Controllers translate between the
 * request/response and the service; they contain no business logic.
 */

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, workspace, tokens } = await authService.register({ name, email, password });

  setRefreshCookie(res, tokens.refreshToken);
  return ApiResponse.created(
    res,
    { user, workspace, accessToken: tokens.accessToken },
    'Account created successfully',
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login({ email, password });

  setRefreshCookie(res, tokens.refreshToken);
  return ApiResponse.ok(res, { user, accessToken: tokens.accessToken }, 'Logged in successfully');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = readRefreshCookie(req);
  const { user, tokens } = await authService.refresh(token);

  setRefreshCookie(res, tokens.refreshToken);
  return ApiResponse.ok(res, { user, accessToken: tokens.accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  clearRefreshCookie(res);
  return ApiResponse.ok(res, null, 'Logged out successfully');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Always 200 to avoid leaking whether the email exists.
  return ApiResponse.ok(
    res,
    null,
    'If an account exists for that email, a reset link has been sent',
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword({ token, password });
  clearRefreshCookie(res);
  return ApiResponse.ok(res, null, 'Password reset successfully. Please log in.');
});

export const me = asyncHandler(async (req, res) => {
  const { user, workspaces } = await authService.getProfile(req.user.id);
  return ApiResponse.ok(res, { user, workspaces }, 'Profile loaded');
});
