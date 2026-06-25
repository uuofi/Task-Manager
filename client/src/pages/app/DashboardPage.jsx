import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useDashboard';
import { dueLabel, relativeTime } from '@/lib/format';
import { STATUS, statusLabel } from '@/lib/taskMeta';
import { useAuthStore } from '@/store/authStore';

const STATUS_COLORS = {
  backlog: '#a1a1aa',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#a855f7',
  done: '#10b981',
  cancelled: '#d4d4d8',
};

function StatCard({ icon: Icon, label, value, tone = 'primary' }) {
  const toneClass = {
    primary: 'text-primary bg-primary/10',
    warning: 'text-amber-600 bg-amber-500/10',
    destructive: 'text-destructive bg-destructive/10',
    success: 'text-emerald-600 bg-emerald-500/10',
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`grid size-11 place-items-center rounded-lg ${toneClass}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-muted-foreground mt-1 text-sm">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ task }) {
  const due = dueLabel(task.dueDate);
  return (
    <Link
      to={`/app/tasks/${task.id}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
    >
      <span className={`size-2 shrink-0 rounded-full ${STATUS[task.status]?.dot}`} />
      <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
      {task.project && (
        <span className="text-muted-foreground hidden text-xs sm:inline">{task.project.key}</span>
      )}
      {due && (
        <Badge variant={due.tone === 'destructive' ? 'destructive' : 'secondary'} className="shrink-0">
          {due.label}
        </Badge>
      )}
    </Link>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const stats = data?.stats ?? {};
  const statusData = Object.entries(data?.statusBreakdown ?? {}).map(([key, value]) => ({
    name: statusLabel(key),
    key,
    value,
  }));
  const hasStatus = statusData.some((s) => s.value > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title={t('dashboard.greeting', { name: user?.name?.split(' ')[0] ?? '' })}
        description={t('dashboard.subtitle')}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarClock} label={t('dashboard.dueToday')} value={stats.dueToday ?? 0} tone="primary" />
        <StatCard icon={AlertTriangle} label={t('dashboard.overdue')} value={stats.overdue ?? 0} tone="destructive" />
        <StatCard icon={ListTodo} label={t('dashboard.assignedToMe')} value={stats.assigned ?? 0} tone="warning" />
        <StatCard
          icon={CheckCircle2}
          label={t('dashboard.completedThisWeek')}
          value={stats.completedThisWeek ?? 0}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today + overdue */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.todaysTasks')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.todayTasks?.length ? (
                <div className="space-y-0.5">
                  {data.todayTasks.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title={t('dashboard.nothingDue')}
                  description={t('dashboard.nothingDueDesc')}
                  className="border-0 py-8"
                />
              )}
            </CardContent>
          </Card>

          {data?.overdueTasks?.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4" /> {t('dashboard.overdue')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0.5">
                  {data.overdueTasks.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: status chart + project progress */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.byStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              {hasStatus ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {statusData.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground py-10 text-center text-sm">No tasks yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4" /> {t('dashboard.projectProgress')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.projectProgress?.length ? (
                data.projectProgress.map((p) => (
                  <Link key={p.project.id} to={`/app/projects/${p.project.id}`} className="block space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{p.project.name}</span>
                      <span className="text-muted-foreground">{p.progress}%</span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">{t('dashboard.noProjects')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentActivity?.length ? (
            <div className="space-y-3">
              {data.recentActivity.map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <UserAvatar user={a.actor} className="size-7" />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{a.actor?.name ?? 'Someone'}</span>{' '}
                    <span className="text-muted-foreground">{a.message}</span>
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">{relativeTime(a.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('dashboard.noActivity')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
