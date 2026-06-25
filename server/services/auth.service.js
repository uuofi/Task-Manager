import { env } from '../config/env.js';
import { ROLES } from '../constants/index.js';
import { userRepository } from '../repositories/user.repository.js';
import { workspaceRepository } from '../repositories/workspace.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { generateSecureToken, hashToken } from '../utils/crypto.js';
import { issueAuthTokens, verifyRefreshToken } from '../utils/jwt.js';
import { uniqueSlug } from '../utils/slug.js';

import { sendPasswordResetEmail } from './email.service.js';

/**
 * Registers a new user and provisions their first (personal) workspace,
 * making them its Owner. Returns the user, workspace and freshly-issued tokens.
 */
const register = async ({ name, email, password }) => {
  if (await userRepository.existsByEmail(email)) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await userRepository.create({ name, email, password });

  const slug = await uniqueSlug(`${name}-workspace`, (s) =>
    workspaceRepository.existsBySlug(s),
  );
  const workspace = await workspaceRepository.create({
    name: `${name}'s Workspace`,
    slug,
    owner: user.id,
    members: [{ user: user.id, role: ROLES.OWNER }],
  });

  const tokens = issueAuthTokens(user);
  user.lastLoginAt = new Date();
  await user.save();

  return { user, workspace, tokens };
};

/** Authenticates a user with email + password. */
const login = async ({ email, password }) => {
  const user = await userRepository.findByEmailWithPassword(email);
  // Generic message to avoid leaking which part was wrong.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  user.lastLoginAt = new Date();
  user.isOnline = true;
  user.lastSeenAt = new Date();
  await user.save();

  const tokens = issueAuthTokens(user);
  return { user, tokens };
};

/**
 * Validates a refresh token and rotates it. The token's `tokenVersion` must
 * match the user's current version (logout / password change invalidate it).
 */
const refresh = async (refreshToken) => {
  if (!refreshToken) throw ApiError.unauthorized('Missing refresh token');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  const user = await userRepository.findById(decoded.sub);
  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    throw ApiError.unauthorized('Session is no longer valid');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  const tokens = issueAuthTokens(user);
  return { user, tokens };
};

/** Logs the user out everywhere by bumping their token version. */
const logout = async (userId) => {
  const user = await userRepository.findById(userId);
  if (user) {
    user.tokenVersion += 1;
    user.isOnline = false;
    user.lastSeenAt = new Date();
    await user.save();
  }
};

/**
 * Initiates password recovery. Always resolves successfully (even for unknown
 * emails) to avoid user enumeration.
 */
const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) return { sent: true };

  const { token, hash } = generateSecureToken();
  user.passwordResetToken = hash;
  user.passwordResetExpires = new Date(Date.now() + env.jwt.resetTokenExpiresMin * 60 * 1000);
  await user.save();

  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user, resetUrl);
  return { sent: true };
};

/** Completes a password reset and invalidates existing sessions. */
const resetPassword = async ({ token, password }) => {
  const user = await userRepository.findByResetTokenHash(hashToken(token));
  if (!user) throw ApiError.badRequest('Password reset link is invalid or has expired');

  user.password = password;
  user.clearPasswordReset();
  user.tokenVersion += 1; // force re-login everywhere
  await user.save();

  return { user };
};

/** Returns the authenticated user with the workspaces they belong to. */
const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  const workspaces = await workspaceRepository.findByMember(userId);
  return { user, workspaces };
};

export const authService = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
};

export default authService;
