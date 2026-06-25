import { formatDistanceToNow, format, isToday, isTomorrow, isPast } from 'date-fns';

/** Initials from a name, e.g. "Ada Lovelace" -> "AL". */
export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

export const formatDate = (date, pattern = 'MMM d, yyyy') => (date ? format(new Date(date), pattern) : '');

export const relativeTime = (date) =>
  date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '';

/** Friendly due-date label: Today / Tomorrow / Overdue / date. */
export const dueLabel = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return { label: 'Today', tone: 'warning' };
  if (isTomorrow(d)) return { label: 'Tomorrow', tone: 'default' };
  if (isPast(d)) return { label: `Overdue · ${format(d, 'MMM d')}`, tone: 'destructive' };
  return { label: format(d, 'MMM d'), tone: 'muted' };
};

/** Seconds -> "1h 23m" / "45m" / "12s". */
export const formatDuration = (totalSeconds = 0) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

/** Clock format for live timer: HH:MM:SS. */
export const clock = (totalSeconds = 0) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
};
