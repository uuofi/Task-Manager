/**
 * Shared task status & priority metadata: labels, ordered columns, and the
 * Tailwind classes used to render their dots/badges consistently everywhere.
 */
export const STATUS = {
  backlog: { label: 'Backlog', dot: 'bg-zinc-400', column: true },
  todo: { label: 'To Do', dot: 'bg-blue-500', column: true },
  in_progress: { label: 'In Progress', dot: 'bg-amber-500', column: true },
  review: { label: 'In Review', dot: 'bg-purple-500', column: true },
  done: { label: 'Done', dot: 'bg-emerald-500', column: true },
  cancelled: { label: 'Cancelled', dot: 'bg-zinc-300', column: false },
};

/** Ordered list of statuses that appear as board columns. */
export const BOARD_COLUMNS = ['backlog', 'todo', 'in_progress', 'review', 'done'];

export const ALL_STATUSES = Object.keys(STATUS);

export const PRIORITY = {
  low: { label: 'Low', className: 'text-zinc-500', badge: 'secondary' },
  medium: { label: 'Medium', className: 'text-blue-500', badge: 'secondary' },
  high: { label: 'High', className: 'text-amber-600', badge: 'warning' },
  urgent: { label: 'Urgent', className: 'text-red-600', badge: 'destructive' },
};

export const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'];

export const statusLabel = (s) => STATUS[s]?.label ?? s;
export const priorityLabel = (p) => PRIORITY[p]?.label ?? p;
