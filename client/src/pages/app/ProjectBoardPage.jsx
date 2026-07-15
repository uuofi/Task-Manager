import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ArrowLeft, LogOut, Plus, Search, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { BoardColumn } from '@/components/board/BoardColumn';
import { CreateTaskDialog } from '@/components/board/CreateTaskDialog';
import { TaskCard } from '@/components/board/TaskCard';
import { TaskDetailDialog } from '@/components/board/TaskDetailDialog';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useSocket } from '@/contexts/SocketContext';
import { useLeaveProject, useProject, useProjectMemberMutations } from '@/hooks/useProjects';
import { useBoard, useTaskMutations } from '@/hooks/useTasks';
import { invitationsApi, workspacesApi } from '@/api/misc.api';
import { BOARD_COLUMNS, PRIORITY_ORDER, PRIORITY } from '@/lib/taskMeta';
import { useAuthStore } from '@/store/authStore';

/** Groups a flat task list into board columns. */
const groupByStatus = (tasks = []) => {
  const groups = Object.fromEntries(BOARD_COLUMNS.map((s) => [s, []]));
  tasks.forEach((t) => {
    if (groups[t.status]) groups[t.status].push(t);
  });
  BOARD_COLUMNS.forEach((s) => groups[s].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  return groups;
};

function ManageMembersDialog({ open, onOpenChange, project, projectId }) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { addMember, removeMember } = useProjectMemberMutations(projectId);
  const leaveProject = useLeaveProject(projectId);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: workspaceMembers = [] } = useQuery({
    queryKey: ['workspace', 'members'],
    queryFn: workspacesApi.members,
    enabled: open,
  });

  const invite = useMutation({
    mutationFn: () => invitationsApi.create({ email: inviteEmail, role: 'member', projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] });
      toast.success("Invitation sent — they'll join this project once they accept");
      setInviteEmail('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const projectMemberIds = useMemo(
    () => new Set((project?.members ?? []).map((m) => m.user?.id || String(m.user))),
    [project?.members],
  );

  const availableToAdd = useMemo(
    () => workspaceMembers.filter((wm) => !projectMemberIds.has(wm.user?.id)),
    [workspaceMembers, projectMemberIds],
  );

  // Gate on the caller's *workspace* role, not their project role — the
  // backend allows any workspace manager/admin/owner to manage membership on
  // any project, even ones they aren't personally a member of.
  const myWorkspaceRole = workspaceMembers.find((wm) => wm.user?.id === me?.id)?.role;
  const canManage = myWorkspaceRole === 'manager' || myWorkspaceRole === 'admin' || myWorkspaceRole === 'owner';

  const isSelfLead = (project?.lead?.id || String(project?.lead)) === me?.id;
  const isSelfMember = projectMemberIds.has(me?.id);

  const handleLeave = () => {
    if (window.confirm(`Leave "${project?.name}"? You can be added back later — your tasks and history stay intact.`)) {
      leaveProject.mutate(undefined, {
        onSuccess: () => {
          onOpenChange(false);
          navigate('/app/projects');
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Project Members</DialogTitle>
        </DialogHeader>

        {/* Current members */}
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Current members ({project?.members?.length ?? 0})
          </p>
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {(project?.members ?? []).map((m) => {
              const u = m.user ?? {};
              const uid = u.id || String(m.user);
              const isLead = (project.lead?.id || String(project.lead)) === uid;
              return (
                <div key={uid} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/40">
                  <UserAvatar user={u} className="size-7 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name ?? '—'}</p>
                    <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs shrink-0">
                    {isLead ? 'lead' : m.role}
                  </Badge>
                  {canManage && !isLead && uid !== me?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive size-7 shrink-0"
                      onClick={() => removeMember.mutate(uid)}
                      disabled={removeMember.isPending}
                      title="Remove from project"
                    >
                      {removeMember.isPending ? <Spinner className="size-3" /> : <X className="size-3.5" />}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add from workspace */}
        {canManage && availableToAdd.length > 0 && (
          <div className="space-y-1 border-t pt-3">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Add from workspace
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {availableToAdd.map((wm) => {
                const u = wm.user ?? {};
                return (
                  <div key={u.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/40">
                    <UserAvatar user={u} className="size-7 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 shrink-0 text-xs px-3"
                      onClick={() => addMember.mutate({ userId: u.id, role: 'member' })}
                      disabled={addMember.isPending}
                    >
                      {addMember.isPending ? <Spinner className="size-3" /> : 'Add'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {canManage && availableToAdd.length === 0 && (
          <p className="text-muted-foreground border-t pt-3 text-sm">
            All workspace members are already in this project.
          </p>
        )}

        {/* Invite someone not yet in the workspace, scoped to just this project */}
        {canManage && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Invite by email
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (inviteEmail.trim()) invite.mutate();
              }}
            >
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="h-8 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 shrink-0 px-3 text-xs"
                disabled={!inviteEmail.trim() || invite.isPending}
              >
                {invite.isPending ? <Spinner className="size-3" /> : 'Invite'}
              </Button>
            </form>
            <p className="text-muted-foreground text-[11px]">
              They must already have a TaskControl account. They'll be added to this project once they accept.
            </p>
          </div>
        )}

        {isSelfMember && !isSelfLead && (
          <div className="border-t pt-3">
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive w-full"
              onClick={handleLeave}
              disabled={leaveProject.isPending}
            >
              {leaveProject.isPending ? <Spinner className="size-3" /> : <LogOut className="size-4" />}
              Leave project
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ProjectBoardPage() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { data: project } = useProject(projectId);
  const { data: tasks, isLoading } = useBoard(projectId);
  const { create, move } = useTaskMutations(projectId);
  const { joinProject, leaveProject } = useSocket();

  // Join the project's realtime room so board/task events stream in live.
  useEffect(() => {
    if (!projectId) return undefined;
    joinProject(projectId);
    return () => leaveProject(projectId);
  }, [projectId, joinProject, leaveProject]);

  const [columns, setColumns] = useState({});
  const [activeTask, setActiveTask] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState('todo');
  const [openTaskId, setOpenTaskId] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);

  const me = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // Display-only filtering; DnD still operates on the full column state.
  const filteredColumns = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (assigneeFilter === 'me' && String(t.assignee?.id || t.assignee) !== String(me?.id)) return false;
      if (assigneeFilter !== 'all' && assigneeFilter !== 'me' && String(t.assignee?.id || t.assignee) !== assigneeFilter) return false;
      if (q) {
        const hay = `${t.title} ${t.key} ${(t.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    };
    const out = {};
    BOARD_COLUMNS.forEach((s) => {
      out[s] = (columns[s] ?? []).filter(matches);
    });
    return out;
  }, [columns, search, priorityFilter, assigneeFilter, me?.id]);

  useEffect(() => {
    if (tasks) setColumns(groupByStatus(tasks));
  }, [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const findContainer = (id) => {
    if (BOARD_COLUMNS.includes(id)) return id;
    return BOARD_COLUMNS.find((s) => columns[s]?.some((t) => t.id === id));
  };

  const handleDragStart = ({ active }) => {
    const container = findContainer(active.id);
    setActiveTask(columns[container]?.find((t) => t.id === active.id) ?? null);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const fromItems = [...prev[from]];
      const toItems = [...prev[to]];
      const idx = fromItems.findIndex((t) => t.id === active.id);
      if (idx === -1) return prev;
      const [moved] = fromItems.splice(idx, 1);
      const overIdx = toItems.findIndex((t) => t.id === over.id);
      const insertAt = overIdx === -1 ? toItems.length : overIdx;
      toItems.splice(insertAt, 0, { ...moved, status: to });
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const container = findContainer(over.id) || findContainer(active.id);
    if (!container) return;

    const items = columns[container] || [];
    let index = items.findIndex((t) => t.id === over.id);
    if (index === -1) index = items.findIndex((t) => t.id === active.id);

    const currentIndex = items.findIndex((t) => t.id === active.id);
    const ordered = currentIndex === -1 ? items : arrayMove(items, currentIndex, index < 0 ? items.length - 1 : index);
    setColumns((prev) => ({ ...prev, [container]: ordered }));

    const pos = ordered.findIndex((t) => t.id === active.id);
    const prevOrder = pos > 0 ? ordered[pos - 1].order ?? pos - 1 : null;
    const nextOrder = pos < ordered.length - 1 ? ordered[pos + 1].order ?? pos + 1 : null;
    let order;
    if (prevOrder !== null && nextOrder !== null) order = (prevOrder + nextOrder) / 2;
    else if (nextOrder !== null) order = nextOrder - 1;
    else if (prevOrder !== null) order = prevOrder + 1;
    else order = 0;

    move.mutate({ id: active.id, payload: { status: container, order } });
  };

  const openCreate = (status) => {
    setCreateStatus(status);
    setCreateOpen(true);
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* Project header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <Button asChild variant="ghost" size="icon" className="lg:hidden">
          <Link to="/app/projects">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        {project ? (
          <>
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: project.color }}
            >
              {project.key.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{project.name}</h1>
              <p className="text-muted-foreground text-xs">{project.key}</p>
            </div>
            {/* Members avatars — click to manage */}
            <button
              className="ml-2 flex -space-x-2 hover:opacity-80 transition-opacity"
              onClick={() => setMembersOpen(true)}
              title="Manage members"
            >
              {(project.members ?? []).slice(0, 5).map((m) => (
                <UserAvatar key={m.user?.id} user={m.user} className="size-7 ring-2 ring-background" />
              ))}
              {(project.members?.length ?? 0) > 5 && (
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-background">
                  +{project.members.length - 5}
                </span>
              )}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1.5"
              onClick={() => setMembersOpen(true)}
            >
              <Users className="size-4" />
              <span className="hidden sm:inline">Members</span>
            </Button>
          </>
        ) : (
          <Skeleton className="h-9 w-48" />
        )}
        <Button variant="cta" className="ms-auto" onClick={() => openCreate('todo')}>
          <Plus className="size-4" /> {t('board.newTask')}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('board.filterTasks')}
            className="h-8 w-48 ps-8"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder={t('task.priority')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('board.allPriorities')}</SelectItem>
            {PRIORITY_ORDER.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Assignee filter */}
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            <SelectItem value="me">My tasks</SelectItem>
            {(project?.members ?? []).map((m) => {
              const u = m.user ?? {};
              if (!u.id || u.id === me?.id) return null;
              return (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        {isLoading ? (
          <div className="flex gap-4">
            {BOARD_COLUMNS.map((s) => (
              <Skeleton key={s} className="h-96 w-72 shrink-0" />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4">
              {BOARD_COLUMNS.map((status) => (
                <BoardColumn
                  key={status}
                  status={status}
                  tasks={filteredColumns[status] ?? []}
                  onOpenTask={(t) => setOpenTaskId(t.id)}
                  onAddTask={openCreate}
                />
              ))}
            </div>
            <DragOverlay>{activeTask && <TaskCard task={activeTask} overlay />}</DragOverlay>
          </DndContext>
        )}
      </div>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        defaultStatus={createStatus}
        createMutation={create}
        members={project?.members ?? []}
      />

      <TaskDetailDialog
        taskId={openTaskId}
        projectId={projectId}
        members={project?.members ?? []}
        open={!!openTaskId}
        onOpenChange={(v) => !v && setOpenTaskId(null)}
      />

      <ManageMembersDialog
        open={membersOpen}
        onOpenChange={setMembersOpen}
        project={project}
        projectId={projectId}
      />
    </div>
  );
}

export default ProjectBoardPage;
