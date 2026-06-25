import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * Used by every shadcn/ui component.
 *
 * @param {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
