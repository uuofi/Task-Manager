import { HTTP_STATUS } from '../constants/index.js';

/**
 * Operational error carrying an HTTP status code and optional field-level
 * details. Thrown anywhere in the request lifecycle and handled centrally by
 * the global error handler.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message Human-readable message
   * @param {Array<{field: string, message: string}>} [details] Validation details
   */
  constructor(statusCode, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  static conflict(message = 'Resource conflict') {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  static unprocessable(message = 'Unprocessable entity', details = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, details);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
  }
}

export default ApiError;
