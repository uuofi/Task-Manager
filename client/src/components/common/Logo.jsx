import { Link } from 'react-router-dom';

import logoMark from '@/assets/logo.png';
import { cn } from '@/lib/utils';

/**
 * Brand mark. Renders as a Link by default, or a plain element when `asLink`
 * is false (e.g. inside another anchor).
 */
export function Logo({ className, withWordmark = true, asLink = true, to = '/' }) {
  const content = (
    <>
      <img
        src={logoMark}
        alt="TaskControl"
        className="size-8 rounded-lg object-cover"
        width={32}
        height={32}
      />
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
