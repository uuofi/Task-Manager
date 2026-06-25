import crypto from 'node:crypto';

/**
 * Generates a cryptographically random URL-safe token plus its SHA-256 hash.
 * The raw token is emailed to the user; only the hash is stored, so a database
 * leak cannot be used to reset passwords.
 *
 * @returns {{ token: string, hash: string }}
 */
export const generateSecureToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashToken(token);
  return { token, hash };
};

/** Hashes a token with SHA-256 for safe storage/comparison. */
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
