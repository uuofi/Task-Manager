import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

/**
 * Signs a short-lived access token. The payload purposely carries only the
 * subject id and token version — everything else is loaded fresh per request.
 *
 * @param {{ sub: string, tokenVersion: number }} payload
 * @returns {string}
 */
export const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });

/**
 * Signs a long-lived refresh token. Stored in an httpOnly cookie and validated
 * against the user's current `tokenVersion` to allow global invalidation.
 *
 * @param {{ sub: string, tokenVersion: number }} payload
 * @returns {string}
 */
export const signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

/** Issues both tokens for a user document. */
export const issueAuthTokens = (user) => {
  const payload = { sub: user.id, tokenVersion: user.tokenVersion };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};
