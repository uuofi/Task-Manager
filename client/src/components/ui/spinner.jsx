import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Accessible loading spinner. */
function Spinner({ className, ...props }) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
