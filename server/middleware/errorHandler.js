import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { HTTP_STATUS } from '../constants/index.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Normalizes various error shapes (Mongoose, JWT, Multer, ApiError) into a
 * consistent ApiError before responding.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose: invalid ObjectId or cast failure
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for "${err.path}": ${err.value}`);
  }

  // Mongoose: schema validation failed
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.unprocessable('Validation failed', details);
  }

  // MongoDB: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`A record with this ${field} already exists`);
  }

  // JWT errors
  if (err instanceof jwt.JsonWebTokenError) {
    return ApiError.unauthorized('Invalid authentication token');
  }
  if (err instanceof jwt.TokenExpiredError) {
    return ApiError.unauthorized('Authentication token has expired');
  }

  // Multer file-size / upload errors
  if (err.name === 'MulterError') {
    return ApiError.badRequest(`File upload error: ${err.message}`);
  }

  // Fallback: unexpected programming error
  return new ApiError(
    err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    err.message || 'Internal server error',
  );
};

/**
 * Express global error-handling middleware. Must be registered last.
 */
 
export const errorHandler = (err, req, res, _next) => {
  const error = normalizeError(err);

  const isServerError = error.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR;
  if (isServerError) {
    logger.error(
      `${req.method} ${req.originalUrl} -> ${error.statusCode}: ${error.message}\n${err.stack || ''}`,
    );
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${error.statusCode}: ${error.message}`);
  }

  const body = {
    success: false,
    message:
      isServerError && env.isProd ? 'Something went wrong. Please try again later.' : error.message,
  };

  if (error.details?.length) body.errors = error.details;
  if (!env.isProd && isServerError) body.stack = err.stack;

  res.status(error.statusCode).json(body);
};

export default errorHandler;
