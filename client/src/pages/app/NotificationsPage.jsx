import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications, useNotificationActions } from '@/hooks/useNotifications';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ limit: 50 });
  const { markRead, markAllRead } = useNotificationActions();
  const items = data?.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Notifications"
        actions={
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        }
      />
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markRead.mutate(n.id);
                  if (n.link) navigate(n.link.startsWith('/app') ? n.link : `/app${n.link}`);
                }}
                className={cn('flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent', !n.isRead && 'bg-primary/5')}
              >
                <UserAvatar user={n.actor} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-muted-foreground text-sm">{n.body}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{relativeTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="bg-cta mt-2 size-2 shrink-0 rounded-full" />}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NotificationsPage;
