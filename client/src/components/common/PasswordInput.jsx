import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Password field with a show/hide toggle. Forwards the ref so it works with
 * React Hook Form's `register`.
 */
export const PasswordInput = forwardRef(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-md transition-colors focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

export default PasswordInput;
