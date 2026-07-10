import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, LogOut, UserMinus, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { invitationsApi, workspacesApi } from '@/api/misc.api';
import { projectsApi } from '@/api/projects.api';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useSocket } from '@/contexts/SocketContext';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const ADMIN_ROLES = new Set(['owner', 'admin']);
const ASSIGNABLE_ROLES = ['member', 'manager', 'admin'];

function PendingInviteRow({ inv, canManage }) {
  const qc = useQueryClient();
  const revoke = useMutation({
    mutationFn: () => invitationsApi.revoke(inv.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitation cancelled');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="flex items-center gap-3 text-sm">
      <Bell className="text-muted-foreground size-4 shrink-0" />
      <span className="flex-1 truncate">{inv.email}</span>
      <Badge variant="secondary">{inv.role}</Badge>
      {canManage && (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-7 shrink-0"
          onClick={() => revoke.mutate()}
          disabled={revoke.isPending}
          title="Cancel invitation"
        >
          {revoke.isPending ? <Spinner className="size-3" /> : <X className="size-4" />}
        </Button>
      )}
    </div>
  );
}

function InviteDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [projectId, setProjectId] = useState('none');

  // Fetch projects only when the dialog is open
  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'list-for-invite'],
    queryFn: () => projectsApi.list({ limit: 100 }),
    enabled: open,
  });
  const projects = projectsData?.data ?? [];

  const invite = useMutation({
    mutationFn: () =>
      invitationsApi.create({
        email,
        role,
        projectId: projectId !== 'none' ? projectId : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitation sent — the user will see it in their notifications');
      setOpen(false);
      setEmail('');
      setProjectId('none');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="cta">
          <UserPlus className="size-4" /> Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Enter the email of a registered user. They will receive an in-app notification to accept or decline.
          </p>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Add to project <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select a project…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Workspace only</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => invite.mutate()} disabled={!email || invite.isPending}>
            {invite.isPending && <Spinner />} Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamPage() {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { isUserOnline } = useSocket();
  const { data: members, isLoading } = useQuery({
    queryKey: ['workspace', 'members'],
    queryFn: workspacesApi.members,
  });
  const { data: invites } = useQuery({
    queryKey: ['invitations'],
    queryFn: invitationsApi.list,
  });

  // Derive the current user's workspace role
  const myRole = members?.find((m) => m.user?.id === me?.id)?.role;
  const canManage = ADMIN_ROLES.has(myRole);
  const isOwnerSelf = myRole === 'owner';

  const removeMember = useMutation({
    mutationFn: (userId) => workspacesApi.removeMember(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', 'members'] });
      toast.success('Member removed from workspace');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }) => workspacesApi.updateMemberRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', 'members'] });
      toast.success('Member role updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const leave = useMutation({
    mutationFn: () => workspacesApi.leave(),
    onSuccess: () => {
      toast.success('You left the workspace');
      navigate('/app');
      window.location.reload();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const headerActions = (
    <div className="flex items-center gap-2">
      {!isOwnerSelf && (
        <Button
          variant="outline"
          onClick={() => {
            if (window.confirm('Leave this workspace? You will lose access to its projects and tasks.')) {
              leave.mutate();
            }
          }}
          disabled={leave.isPending}
        >
          {leave.isPending ? <Spinner /> : <LogOut className="size-4" />} Leave workspace
        </Button>
      )}
      {canManage && <InviteDialog />}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Team"
        description="Manage who has access to this workspace."
        actions={headerActions}
      />

      {/* Pending invitations — only shown to admins */}
      {canManage && invites?.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Pending invitations (awaiting response)
            </p>
            {invites.map((inv) => (
              <PendingInviteRow key={inv.id} inv={inv} canManage={canManage} />
            ))}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {members?.map((m) => {
              const isOwner = m.role === 'owner';
              const isSelf = m.user.id === me?.id;
              const canRemove = canManage && !isOwner && !isSelf;

              return (
                <div key={m.user.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative">
                    <UserAvatar user={m.user} className="size-9" />
                    <span
                      className={cn(
                        'border-background absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2',
                        isUserOnline(m.user.id) ? 'bg-emerald-500' : 'bg-zinc-300',
                      )}
                      title={isUserOnline(m.user.id) ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.user.name}{' '}
                      {isSelf && <span className="text-muted-foreground">(you)</span>}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{m.user.email}</p>
                  </div>
                  <div className="hidden text-right text-xs sm:block">
                    <p className="font-medium">
                      {m.stats.completedTasks}/{m.stats.totalTasks} done
                    </p>
                    <p className="text-muted-foreground">{m.stats.completionRate}% completion</p>
                  </div>
                  {canRemove ? (
                    <Select
                      value={m.role}
                      onValueChange={(role) => changeRole.mutate({ userId: m.user.id, role })}
                      disabled={changeRole.isPending}
                    >
                      <SelectTrigger size="sm" className="w-28 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={isOwner ? 'default' : 'secondary'} className="capitalize">
                      {m.role}
                    </Badge>
                  )}
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                      onClick={() => removeMember.mutate(m.user.id)}
                      disabled={removeMember.isPending}
                      title="Remove from workspace"
                    >
                      {removeMember.isPending ? (
                        <Spinner className="size-3" />
                      ) : (
                        <UserMinus className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TeamPage;
