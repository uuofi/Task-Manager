/**
 * Standardized success-response envelope so every endpoint returns a
 * predictable shape: { success, message, data, meta }.
 */
export class ApiResponse {
  /**
   * @param {import('express').Response} res
   * @param {object} options
   * @param {number} [options.statusCode=200]
   * @param {string} [options.message='Success']
   * @param {*} [options.data=null]
   * @param {object} [options.meta] Pagination / extra metadata
   */
  static send(res, { statusCode = 200, message = 'Success', data = null, meta } = {}) {
    const body = { success: true, message, data };
    if (meta !== undefined) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static ok(res, data, message = 'Success', meta) {
    return ApiResponse.send(res, { statusCode: 200, message, data, meta });
  }

  static created(res, data, message = 'Created successfully') {
    return ApiResponse.send(res, { statusCode: 201, message, data });
  }

  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Builds a pagination meta object from common query parameters.
   */
  static paginate({ page, limit, total }) {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}

export default ApiResponse;
