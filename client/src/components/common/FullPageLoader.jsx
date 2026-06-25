import { Spinner } from '@/components/ui/spinner';

/** Centered full-viewport loader shown during auth bootstrap / route loads. */
export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-3">
      <Spinner className="text-primary size-7" />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

export default FullPageLoader;
