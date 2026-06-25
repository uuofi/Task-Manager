import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="bg-muted text-muted-foreground grid size-12 place-items-center rounded-full">
          <Icon className="size-6" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default EmptyState;
