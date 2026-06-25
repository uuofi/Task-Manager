import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Pause,
  Play,
  Plus,
  Repeat,
  Send,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { tasksApi } from '@/api/tasks.api';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useSocket } from '@/contexts/SocketContext';
import { useTask } from '@/hooks/useTasks';
import { clock, relativeTime } from '@/lib/format';
import { qk } from '@/lib/queryKeys';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { BOARD_COLUMNS, PRIORITY, PRIORITY_ORDER, statusLabel } from '@/lib/taskMeta';

function useLiveElapsed(timer) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!timer) return setElapsed(0);
    setElapsed(timer.elapsedSeconds ?? timer.accumulatedSeconds ?? 0);
    if (timer.status !== 'running') return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timer]);
  return elapsed;
}

function TimerWidget({ taskId }) {
  const qc = useQueryClient();
  const { data: timer } = useQuery({ queryKey: qk.timer(taskId), queryFn: () => tasksApi.getTimer(taskId) });
  const elapsed = useLiveElapsed(timer);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.timer(taskId) });
    qc.invalidateQueries({ queryKey: qk.task(taskId) });
  };
  const onError = (e) => toast.error(getErrorMessage(e));
  const start = useMutation({ mutationFn: () => tasksApi.startTimer(taskId), onSuccess: invalidate, onError });
  const pause = useMutation({ mutationFn: () => tasksApi.pauseTimer(taskId), onSuccess: invalidate, onError });
  const resume = useMutation({ mutationFn: () => tasksApi.resumeTimer(taskId), onSuccess: invalidate, onError });
  const stop = useMutation({ mutationFn: () => tasksApi.stopTimer(taskId), onSuccess: invalidate, onError });

  const running = timer?.status === 'running';
  const paused = timer?.status === 'paused';

  return (
    <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-muted-foreground text-xs">Timer</p>
        <p className="font-mono text-lg font-semibold tabular-nums">{clock(elapsed)}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {!timer && (
          <Button size="sm" onClick={() => start.mutate()} disabled={start.isPending}>
            <Play className="size-4" /> Start
          </Button>
        )}
        {running && (
          <Button size="sm" variant="outline" onClick={() => pause.mutate()}>
            <Pause className="size-4" /> Pause
          </Button>
        )}
        {paused && (
          <Button size="sm" variant="outline" onClick={() => resume.mutate()}>
            <Play className="size-4" /> Resume
          </Button>
        )}
        {(running || paused) && (
          <Button size="sm" variant="destructive" onClick={() => stop.mutate()}>
            <Square className="size-4" /> Stop
          </Button>
        )}
      </div>
    </div>
  );
}

function Checklist({ task }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.task(task.id) });
  const add = useMutation({ mutationFn: (t) => tasksApi.addChecklistItem(task.id, t), onSuccess: invalidate });
  const toggle = useMutation({ mutationFn: (id) => tasksApi.toggleChecklistItem(task.id, id), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id) => tasksApi.removeChecklistItem(task.id, id), onSuccess: invalidate });

  const done = task.checklist?.filter((c) => c.done).length ?? 0;
  const total = task.checklist?.length ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Checklist</Label>
        {total > 0 && <span className="text-muted-foreground text-xs">{done}/{total}</span>}
      </div>
      {total > 0 && (
        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      )}
      <div className="space-y-1">
        {task.checklist?.map((item) => (
          <div key={item.id} className="group flex items-center gap-2">
            <input type="checkbox" checked={item.done} onChange={() => toggle.mutate(item.id)} className="accent-primary size-4 cursor-pointer" />
            <span className={item.done ? 'text-muted-foreground flex-1 text-sm line-through' : 'flex-1 text-sm'}>{item.text}</span>
            <button onClick={() => remove.mutate(item.id)} className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) add.mutate(text.trim(), { onSuccess: () => setText('') });
        }}
        className="flex gap-2"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an item…" className="h-8" />
        <Button type="submit" size="sm" variant="outline" disabled={!text.trim()}>
          <Plus className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function Comments({ taskId, projectId }) {
  const qc = useQueryClient();
  const endRef = useRef(null);
  const typingTimeout = useRef(null);
  const [body, setBody] = useState('');
  const [typers, setTypers] = useState([]);
  const { socket, emitTyping } = useSocket();
  const { data: comments } = useQuery({ queryKey: qk.comments(taskId), queryFn: () => tasksApi.listComments(taskId) });
  const post = useMutation({
    mutationFn: (text) => tasksApi.createComment(taskId, { body: text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.comments(taskId) });
      setBody('');
      emitTyping(false, { projectId, taskId });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments?.length]);

  // Listen for other people typing on this task.
  useEffect(() => {
    if (!socket) return undefined;
    const onStart = ({ taskId: tid, user }) => {
      if (tid !== taskId) return;
      setTypers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
    };
    const onStop = ({ taskId: tid, user }) => {
      if (tid !== taskId) return;
      setTypers((prev) => prev.filter((u) => u.id !== user.id));
    };
    socket.on(SOCKET_EVENTS.TYPING_START, onStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, onStop);
    return () => {
      socket.off(SOCKET_EVENTS.TYPING_START, onStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, onStop);
    };
  }, [socket, taskId]);

  const handleChange = (e) => {
    setBody(e.target.value);
    emitTyping(true, { projectId, taskId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false, { projectId, taskId }), 1500);
  };

  const visible = (comments ?? []).filter((c) => !c.isDeleted);

  return (
    <div className="space-y-3">
      <Label>Comments</Label>
      <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 && <p className="text-muted-foreground text-sm">No comments yet.</p>}
        {visible.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <UserAvatar user={c.author} className="size-7" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{c.author?.name}</span>{' '}
                <span className="text-muted-foreground text-xs">{relativeTime(c.createdAt)}</span>
              </p>
              <p className="text-sm">{c.body}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {typers.length > 0 && (
        <p className="text-muted-foreground text-xs italic">
          {typers.map((u) => u.name).join(', ')} {typers.length === 1 ? 'is' : 'are'} typing…
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) post.mutate(body.trim());
        }}
        className="flex gap-2"
      >
        <Input value={body} onChange={handleChange} placeholder="Write a comment…" />
        <Button type="submit" size="icon" disabled={!body.trim() || post.isPending}>
          {post.isPending ? <Spinner /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
}

function TagsField({ task, onSave }) {
  const [value, setValue] = useState('');
  const tags = task.tags ?? [];

  const add = () => {
    const t = value.trim().toLowerCase();
    if (t && !tags.includes(t)) onSave({ tags: [...tags, t] });
    setValue('');
  };
  const remove = (t) => onSave({ tags: tags.filter((x) => x !== t) });

  return (
    <div className="space-y-2">
      <Label className="text-xs">Tags</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1">
            {t}
            <button onClick={() => remove(t)} className="hover:text-destructive">
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder="Add tag…"
          className="h-7 min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function RecurrenceField({ task, onSave }) {
  const frequency = task.recurrence?.frequency || 'none';
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Repeat className="text-muted-foreground size-4" />
        <span className="text-sm font-medium">Repeat</span>
      </div>
      <Select
        value={frequency}
        onValueChange={(v) => onSave({ recurrence: { ...task.recurrence, frequency: v } })}
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Never</SelectItem>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function TaskDetailDialog({ taskId, members = [], open, onOpenChange }) {
  const qc = useQueryClient();
  const { data: task, isLoading } = useTask(open ? taskId : null);

  const update = useMutation({
    mutationFn: (payload) => tasksApi.update(taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.task(taskId) });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => tasksApi.remove(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
      toast.success('Task deleted');
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [task]);

  const saveField = (payload) => update.mutate(payload);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {isLoading || !task ? (
          <div className="space-y-4">
            <Spinner className="text-primary mx-auto size-6" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{task.key}</Badge>
              {task.isOverdue && <Badge variant="destructive">Overdue</Badge>}
            </div>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== task.title && saveField({ title })}
              className="border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={task.status} onValueChange={(v) => saveField({ status: v })}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOARD_COLUMNS.concat('cancelled').map((s) => (
                      <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={task.priority} onValueChange={(v) => saveField({ priority: v })}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_ORDER.map((p) => (
                      <SelectItem key={p} value={p}>{PRIORITY[p].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Assignee</Label>
                <Select
                  value={task.assignee?.id || 'unassigned'}
                  onValueChange={(v) => saveField({ assignee: v === 'unassigned' ? null : v })}
                >
                  <SelectTrigger size="sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user?.id} value={m.user?.id}>{m.user?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due date</Label>
                <Input
                  type="date"
                  className="h-8"
                  defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                  onChange={(e) => saveField({ dueDate: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Est. hours</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  className="h-8"
                  defaultValue={task.estimatedHours || ''}
                  onBlur={(e) => saveField({ estimatedHours: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Actual hours</Label>
                <Input className="h-8" value={task.actualHours ?? 0} readOnly />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => description !== (task.description || '') && saveField({ description })}
                placeholder="Add a description…"
              />
            </div>

            <TagsField task={task} onSave={saveField} />
            <RecurrenceField task={task} onSave={saveField} />
            <TimerWidget taskId={task.id} />
            <Checklist task={task} />
            <Comments taskId={task.id} projectId={task.project?.id || task.project} />

            <div className="flex justify-between border-t pt-4">
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove.mutate()}>
                <Trash2 className="size-4" /> Delete task
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TaskDetailDialog;
