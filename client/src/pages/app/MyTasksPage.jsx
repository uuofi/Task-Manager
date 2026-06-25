import { ListChecks } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTaskList } from '@/hooks/useTasks';
import { dueLabel } from '@/lib/format';
import { PRIORITY, STATUS, statusLabel } from '@/lib/taskMeta';
import { useAuthStore } from '@/store/authStore';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

const SCOPE_FILTERS = [
  { key: 'all', label: 'All Team Tasks' },
  { key: 'mine', label: 'Assigned to me' },
  { key: 'created', label: 'Created by me' },
];

export function MyTasksPage() {
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState('all');
  const [scope, setScope] = useState('all');

  const params = { limit: 200, sort: '-createdAt' };
  if (statusFilter !== 'all') params.status = statusFilter;
  if (scope === 'mine') params.assignee = user?.id;
  if (scope === 'created') params.reporter = user?.id;

  const { data, isLoading } = useTaskList(params);
  const tasks = data?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Tasks"
        description="All tasks across every project in this workspace."
      />

      {/* Scope selector */}
      <div className="flex flex-wrap gap-2">
        {SCOPE_FILTERS.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              scope === s.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {STATUS_FILTERS.map((f) => (
            <TabsTrigger key={f.key} value={f.key}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks found"
          description="Tasks added by you or your teammates will appear here."
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {tasks.map((t) => {
              const due = dueLabel(t.dueDate);
              return (
                <Link
                  key={t.id}
                  to={`/app/tasks/${t.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${STATUS[t.status]?.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.project?.name
                        ? <><span className="font-medium text-foreground/70">{t.project.name}</span> · </>
                        : null}
                      {statusLabel(t.status)}
                    </p>
                  </div>
                  {t.assignee && (
                    <UserAvatar user={t.assignee} className="size-6 shrink-0" title={t.assignee.name} />
                  )}
                  <Badge
                    variant={PRIORITY[t.priority]?.badge ?? 'secondary'}
                    className="hidden sm:inline-flex"
                  >
                    {PRIORITY[t.priority]?.label}
                  </Badge>
                  {due && (
                    <Badge variant={due.tone === 'destructive' ? 'destructive' : 'secondary'}>
                      {due.label}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MyTasksPage;
