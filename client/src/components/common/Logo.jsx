import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

/**
 * Brand mark. Renders as a Link by default, or a plain element when `asLink`
 * is false (e.g. inside another anchor).
 */
export function Logo({ className, withWordmark = true, asLink = true, to = '/' }) {
  const content = (
    <>
      <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-bold">
        TC
      </span>
      {withWordmark && <span className="text-base font-semibold tracking-tight">TaskControl</span>}
    </>
  );

  const classes = cn('flex items-center gap-2', className);

  if (asLink) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
}

export default Logo;
