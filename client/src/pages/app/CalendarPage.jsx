import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTaskList } from '@/hooks/useTasks';
import { STATUS } from '@/lib/taskMeta';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarPage() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Tasks grouped by due date (existing behaviour)
  const { data: dueData } = useTaskList({
    dueAfter: gridStart.toISOString(),
    dueBefore: gridEnd.toISOString(),
    limit: 200,
  });
  const dueTasks = dueData?.data ?? [];

  // Tasks grouped by creation date
  const { data: createdData } = useTaskList({
    createdAfter: gridStart.toISOString(),
    createdBefore: gridEnd.toISOString(),
    limit: 200,
  });
  const createdTasks = createdData?.data ?? [];

  // Map: 'yyyy-MM-dd' → tasks due that day
  const byDueDay = useMemo(() => {
    const map = {};
    dueTasks.forEach((t) => {
      if (!t.dueDate) return;
      const key = format(new Date(t.dueDate), 'yyyy-MM-dd');
      (map[key] ||= []).push(t);
    });
    return map;
  }, [dueTasks]);

  // Map: 'yyyy-MM-dd' → tasks created that day
  const byCreatedDay = useMemo(() => {
    const map = {};
    createdTasks.forEach((t) => {
      if (!t.createdAt) return;
      const key = format(new Date(t.createdAt), 'yyyy-MM-dd');
      (map[key] ||= []).push(t);
    });
    return map;
  }, [createdTasks]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <PageHeader
        title="Calendar"
        description="Tasks by due date and creation date."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-36 text-center text-sm font-semibold">
              {format(cursor, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          </div>
        }
      />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
          Task added on this day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-rose-500 shrink-0" />
          Task due on this day
        </span>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-muted-foreground p-2 text-center text-xs font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayDueTasks = byDueDay[key] ?? [];
            const dayCreatedTasks = byCreatedDay[key] ?? [];
            const hasDue = dayDueTasks.length > 0;
            const hasCreated = dayCreatedTasks.length > 0;

            return (
              <div
                key={key}
                className={cn(
                  'min-h-28 border-b border-r p-1.5',
                  !isSameMonth(day, cursor) && 'bg-muted/30 text-muted-foreground',
                )}
              >
                {/* Day number + dots */}
                <div className="mb-1 flex items-center gap-1">
                  <div
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full text-xs',
                      isToday(day) && 'bg-primary text-primary-foreground font-semibold',
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  {/* Colored marker dots */}
                  <div className="flex gap-0.5">
                    {hasCreated && (
                      <span
                        className="size-2 rounded-full bg-emerald-500 shrink-0"
                        title={`${dayCreatedTasks.length} task${dayCreatedTasks.length > 1 ? 's' : ''} added`}
                      />
                    )}
                    {hasDue && (
                      <span
                        className="size-2 rounded-full bg-rose-500 shrink-0"
                        title={`${dayDueTasks.length} task${dayDueTasks.length > 1 ? 's' : ''} due`}
                      />
                    )}
                  </div>
                </div>

                {/* Due tasks list */}
                <div className="space-y-0.5">
                  {dayDueTasks.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/app/tasks/${t.id}`)}
                      className="flex w-full items-center gap-1 truncate rounded bg-rose-500/10 px-1.5 py-0.5 text-left text-[11px] hover:bg-rose-500/20 border border-rose-500/20"
                      title={`Due: ${t.title}`}
                    >
                      <span className={cn('size-1.5 shrink-0 rounded-full', STATUS[t.status]?.dot)} />
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                  {dayDueTasks.length > 3 && (
                    <p className="text-muted-foreground px-1 text-[10px]">
                      +{dayDueTasks.length - 3} more due
                    </p>
                  )}

                  {/* Created tasks (smaller, dimmer) */}
                  {dayCreatedTasks.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {dayCreatedTasks.slice(0, 2).map((t) => (
                        <button
                          key={`c-${t.id}`}
                          onClick={() => navigate(`/app/tasks/${t.id}`)}
                          className="flex w-full items-center gap-1 truncate rounded bg-emerald-500/10 px-1.5 py-0.5 text-left text-[11px] hover:bg-emerald-500/20 border border-emerald-500/20"
                          title={`Added: ${t.title}`}
                        >
                          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                          <span className="truncate">{t.title}</span>
                        </button>
                      ))}
                      {dayCreatedTasks.length > 2 && (
                        <p className="text-muted-foreground px-1 text-[10px]">
                          +{dayCreatedTasks.length - 2} more added
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default CalendarPage;
