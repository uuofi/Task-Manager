import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { customAlphabet } from 'nanoid';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

/**
 * Builds a collision-resistant stored filename while preserving the extension.
 */
const buildStoredName = (originalName) => {
  const ext = path.extname(originalName).toLowerCase().slice(0, 10);
  const stamp = Date.now().toString(36);
  return `${stamp}-${nanoid()}${ext}`;
};

/**
 * Local-disk storage driver. Writes under `<server>/<UPLOAD_DIR>` and serves
 * via the `/uploads` static route mounted in app.js.
 */
const localDriver = {
  name: 'local',
  uploadRoot: path.resolve(__dirname, '..', env.storage.uploadDir),

  async save({ buffer, originalName }) {
    await fs.mkdir(this.uploadRoot, { recursive: true });
    const storedName = buildStoredName(originalName);
    await fs.writeFile(path.join(this.uploadRoot, storedName), buffer);
    return { storedName, url: `/uploads/${storedName}`, driver: this.name };
  },

  async remove(storedName) {
    if (!storedName) return;
    try {
      await fs.unlink(path.join(this.uploadRoot, storedName));
    } catch (err) {
      if (err.code !== 'ENOENT') logger.warn(`Failed to remove file ${storedName}: ${err.message}`);
    }
  },
};

// Driver registry — add cloudinary/s3 implementations here without touching
// callers. They only depend on the storageService interface below.
const drivers = { local: localDriver };

const driver = drivers[env.storage.driver] || localDriver;
if (!drivers[env.storage.driver]) {
  logger.warn(`Unknown STORAGE_DRIVER "${env.storage.driver}", falling back to local`);
}

/**
 * Storage facade used by the rest of the app.
 */
export const storageService = {
  driverName: driver.name,

  /** Persists an uploaded file buffer and returns its descriptor. */
  save(file) {
    return driver.save({ buffer: file.buffer, originalName: file.originalname });
  },

  /** Deletes a previously-saved file by its stored name. */
  remove(storedName) {
    return driver.remove(storedName);
  },

  /** Deterministic checksum, useful for de-duplication if desired. */
  checksum(buffer) {
    return createHash('sha256').update(buffer).digest('hex');
  },
};

export default storageService;
