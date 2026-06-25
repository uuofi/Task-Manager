/**
 * Wraps an async Express handler so rejected promises are forwarded to the
 * global error handler instead of crashing the process. Removes the need for
 * try/catch in every controller.
 *
 * @param {Function} fn async (req, res, next) handler
 * @returns {Function}
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
