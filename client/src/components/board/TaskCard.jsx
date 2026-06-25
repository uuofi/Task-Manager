import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, MessageSquare, Paperclip } from 'lucide-react';

import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { dueLabel } from '@/lib/format';
import { PRIORITY } from '@/lib/taskMeta';
import { cn } from '@/lib/utils';

export function TaskCard({ task, onOpen, overlay = false }) {
  const sortable = useSortable({ id: task.id, data: { status: task.status } });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style = { transform: CSS.Translate.toString(transform), transition };
  const due = dueLabel(task.dueDate);
  const priority = PRIORITY[task.priority];
  const checklistDone = task.checklist?.filter((c) => c.done).length ?? 0;
  const checklistTotal = task.checklist?.length ?? 0;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => onOpen?.(task)}
      className={cn(
        'bg-card group cursor-pointer space-y-2.5 rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'opacity-40',
        overlay && 'rotate-2 shadow-lg',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        {priority && (
          <span className={cn('mt-0.5 size-2 shrink-0 rounded-full', {
            'bg-zinc-400': task.priority === 'low',
            'bg-blue-500': task.priority === 'medium',
            'bg-amber-500': task.priority === 'high',
            'bg-red-500': task.priority === 'urgent',
          })} title={priority.label} />
        )}
      </div>

      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <span className="font-mono">{task.key}</span>
          {checklistTotal > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare className="size-3.5" />
              {checklistDone}/{checklistTotal}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {task.commentCount}
            </span>
          )}
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="size-3.5" />
              {task.attachments.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {due && (
            <Badge
              variant={due.tone === 'destructive' ? 'destructive' : 'secondary'}
              className="text-[10px]"
            >
              {due.label}
            </Badge>
          )}
          {task.assignee && <UserAvatar user={task.assignee} className="size-6" />}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
