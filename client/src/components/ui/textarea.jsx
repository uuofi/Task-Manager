import { cn } from '@/lib/utils';

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors outline-none',
        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
