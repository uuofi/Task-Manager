import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Verifies the Bearer access token, loads the user, and attaches it as
 * `req.user`. Rejects tokens whose `tokenVersion` no longer matches (i.e. the
 * user has logged out everywhere or changed their password).
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await userRepository.findById(decoded.sub);
  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    throw ApiError.unauthorized('Session is no longer valid');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  req.user = user;
  next();
});

export default authenticate;
