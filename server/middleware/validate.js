import { validationResult } from 'express-validator';

import { ApiError } from '../utils/ApiError.js';

/**
 * Runs a list of express-validator chains, then collects any validation errors
 * into a single 422 response. Use as the final middleware in a route's chain.
 *
 * @param {import('express-validator').ValidationChain[]} validations
 * @returns {import('express').RequestHandler}
 */
export const validate = (validations) => async (req, _res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return next(ApiError.unprocessable('Validation failed', details));
};

export default validate;
