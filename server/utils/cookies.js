import { env } from '../config/env.js';
import { COOKIE_NAMES } from '../constants/index.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sets the refresh token as a hardened httpOnly cookie. `secure` + `sameSite`
 * are tightened in production.
 */
export const setRefreshCookie = (res, token) => {
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_MS,
    signed: true,
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/',
    signed: true,
  });
};

export const readRefreshCookie = (req) => req.signedCookies?.[COOKIE_NAMES.REFRESH_TOKEN];
