import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import { TaskCard } from '@/components/board/TaskCard';
import { Button } from '@/components/ui/button';
import { STATUS } from '@/lib/taskMeta';
import { cn } from '@/lib/utils';

export function BoardColumn({ status, tasks, onOpenTask, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });
  const meta = STATUS[status];

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={cn('size-2.5 rounded-full', meta.dot)} />
        <h3 className="text-sm font-semibold">{meta.label}</h3>
        <span className="text-muted-foreground text-xs">{tasks.length}</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${meta.label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 rounded-xl border border-dashed p-2 transition-colors',
          isOver ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/40',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <button
            onClick={() => onAddTask(status)}
            className="text-muted-foreground hover:bg-accent flex w-full items-center justify-center gap-1 rounded-lg py-6 text-xs transition-colors"
          >
            <Plus className="size-3.5" /> Add task
          </button>
        )}
      </div>
    </div>
  );
}

export default BoardColumn;
