import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle2, ListTodo, UserX, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { dashboardApi } from '@/api/misc.api';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSocket } from '@/contexts/SocketContext';
import { PRIORITY, STATUS, statusLabel } from '@/lib/taskMeta';

const STATUS_COLORS = {
  backlog: '#a1a1aa',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#a855f7',
  done: '#10b981',
  cancelled: '#d4d4d8',
};

const PRIORITY_COLORS = {
  low: '#71717a',
  medium: '#3b82f6',
  high: '#d97706',
  urgent: '#dc2626',
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

/** A member's workload row with a stacked open/in-progress/done bar. */
function WorkloadRow({ member, maxTotal, isOnline }) {
  const { user, total, open, inProgress, completed, overdue, completionRate } = member;
  const width = (n) => (maxTotal ? `${(n / maxTotal) * 100}%` : '0%');

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative shrink-0">
        <UserAvatar user={user} className="size-9" />
        <span
          className={`border-background absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 ${
            isOnline ? 'bg-emerald-500' : 'bg-zinc-300'
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <Badge variant="secondary" className="capitalize">
            {member.role}
          </Badge>
          {overdue > 0 && (
            <Badge variant="destructive">{overdue} overdue</Badge>
          )}
        </div>
        {/* Stacked workload bar */}
        <div className="bg-muted mt-2 flex h-2 overflow-hidden rounded-full">
          <div style={{ width: width(open - inProgress), backgroundColor: STATUS_COLORS.todo }} />
          <div style={{ width: width(inProgress), backgroundColor: STATUS_COLORS.in_progress }} />
          <div style={{ width: width(completed), backgroundColor: STATUS_COLORS.done }} />
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm font-semibold tabular-nums">{open} open</p>
        <p className="text-muted-foreground text-xs">
          {completed}/{total} · {completionRate}%
        </p>
      </div>
    </div>
  );
}

export function TeamInsightsPage() {
  const { t } = useTranslation();
  const { isUserOnline } = useSocket();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'team'],
    queryFn: dashboardApi.team,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const totals = data?.totals ?? {};
  const members = data?.members ?? [];
  const maxTotal = Math.max(1, ...members.map((m) => m.total));

  const statusData = Object.entries(data?.statusBreakdown ?? {})
    .map(([key, value]) => ({ name: statusLabel(key), key, value }))
    .filter((s) => s.value > 0);
  const priorityData = Object.entries(data?.priorityBreakdown ?? {})
    .map(([key, value]) => ({ name: PRIORITY[key]?.label ?? key, key, value }))
    .filter((s) => s.value > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title={t('insights.title')}
        description={t('insights.subtitle')}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={ListTodo} label={t('insights.totalTasks')} value={totals.totalTasks ?? 0} tone="primary" />
        <StatCard icon={CheckCircle2} label={t('insights.completionRate')} value={`${totals.completionRate ?? 0}%`} tone="success" />
        <StatCard icon={Activity} label={t('insights.overdue')} value={totals.overdue ?? 0} tone="destructive" />
        <StatCard icon={UserX} label={t('insights.unassigned')} value={totals.unassigned ?? 0} tone="warning" />
        <StatCard icon={Users} label={t('insights.members')} value={totals.memberCount ?? 0} tone="primary" />
      </div>

      {/* Workload distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('insights.workload')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-4 border-b px-4 pb-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.todo }} />
              {t('insights.todo')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.in_progress }} />
              {statusLabel('in_progress')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.done }} />
              {statusLabel('done')}
            </span>
          </div>
          <div className="divide-y">
            {members.length === 0 ? (
              <p className="text-muted-foreground p-6 text-center text-sm">{t('insights.noMembers')}</p>
            ) : (
              members.map((m) => (
                <WorkloadRow
                  key={m.user.id}
                  member={m}
                  maxTotal={maxTotal}
                  isOnline={isUserOnline(m.user.id)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('insights.byStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">{t('insights.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusData.map((d) => (
                      <Cell key={d.key} fill={STATUS_COLORS[d.key] ?? '#a1a1aa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Priority breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('insights.byPriority')}</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityData.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">{t('insights.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((d) => (
                      <Cell key={d.key} fill={PRIORITY_COLORS[d.key] ?? '#a1a1aa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TeamInsightsPage;
