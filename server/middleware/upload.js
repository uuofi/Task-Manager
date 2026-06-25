import multer from 'multer';

import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Buffer files in memory so the storage service controls where bytes land
// (local disk now; S3/Cloudinary later) without changing this middleware.
const storage = multer.memoryStorage();

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
};

const limits = { fileSize: env.storage.maxFileSizeMb * 1024 * 1024 };

const multerInstance = multer({ storage, fileFilter, limits });

/** Single-file upload under the given field name. */
export const uploadSingle = (field) => multerInstance.single(field);

/** Avatar-specific limiter (images only) reuses the same instance. */
export const uploadAvatar = multerInstance.single('avatar');

/** Multiple files (e.g. task attachments). */
export const uploadMany = (field, max = 5) => multerInstance.array(field, max);

export default multerInstance;
