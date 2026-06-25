import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { useNotifications, useNotificationActions, useUnreadCount, useRespondToInvitation } from '@/hooks/useNotifications';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

function WorkspaceInviteNotification({ n, onRespond, isPending }) {
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2 border-b px-4 py-3 text-left',
        !n.isRead && 'bg-primary/5',
      )}
    >
      <div className="flex gap-3">
        <UserAvatar user={n.actor} className="size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{n.title}</p>
          <p className="text-muted-foreground line-clamp-2 text-xs">{n.body}</p>
          <p className="text-muted-foreground mt-1 text-[11px]">{relativeTime(n.createdAt)}</p>
        </div>
        {!n.isRead && <span className="bg-cta mt-1.5 size-2 shrink-0 self-start rounded-full" />}
      </div>
      {n.entityId && (
        <div className="flex gap-2 pl-11">
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => onRespond(n, 'accept')}
            disabled={isPending}
          >
            {isPending ? <Spinner className="size-3" /> : <Check className="size-3" />}
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={() => onRespond(n, 'decline')}
            disabled={isPending}
          >
            <X className="size-3" />
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { data: unread = 0 } = useUnreadCount();
  const { data } = useNotifications({ limit: 8 });
  const { markRead, markAllRead } = useNotificationActions();
  const respond = useRespondToInvitation();
  const items = data?.data ?? [];

  const onItemClick = (n) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.link) navigate(n.link.startsWith('/app') ? n.link : `/app${n.link}`);
  };

  const onRespond = (n, action) => {
    respond.mutate({ notificationId: n.id, invitationId: n.entityId, action });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="bg-cta text-cta-foreground absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">
              You&apos;re all caught up 🎉
            </p>
          ) : (
            items.map((n) =>
              n.type === 'workspace_invitation' ? (
                <WorkspaceInviteNotification
                  key={n.id}
                  n={n}
                  onRespond={onRespond}
                  isPending={respond.isPending}
                />
              ) : (
                <button
                  key={n.id}
                  onClick={() => onItemClick(n)}
                  className={cn(
                    'flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/60',
                    !n.isRead && 'bg-primary/5',
                  )}
                >
                  <UserAvatar user={n.actor} className="size-8" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="text-muted-foreground line-clamp-2 text-xs">{n.body}</p>
                    <p className="text-muted-foreground mt-1 text-[11px]">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="bg-cta mt-1.5 size-2 shrink-0 rounded-full" />}
                </button>
              ),
            )
          )}
        </div>
        <div className="border-t p-2">
          <Button variant="ghost" className="w-full" onClick={() => navigate('/app/notifications')}>
            View all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
