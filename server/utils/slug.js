import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6);

/** Converts arbitrary text into a URL-safe slug base. */
export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';

/**
 * Produces a unique slug by appending a short random suffix until the provided
 * `exists` predicate returns falsy.
 *
 * @param {string} base
 * @param {(slug: string) => Promise<boolean>} exists
 * @returns {Promise<string>}
 */
export const uniqueSlug = async (base, exists) => {
  const root = slugify(base);
  let candidate = root;
  while (await exists(candidate)) {
    candidate = `${root}-${nanoid()}`;
  }
  return candidate;
};
