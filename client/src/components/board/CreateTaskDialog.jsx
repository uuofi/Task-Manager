import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { PRIORITY_ORDER, PRIORITY, statusLabel, BOARD_COLUMNS } from '@/lib/taskMeta';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(10000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.string(),
  dueDate: z.string().optional(),
});

export function CreateTaskDialog({ open, onOpenChange, projectId, defaultStatus, createMutation, members = [] }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', priority: 'medium', status: defaultStatus || 'todo', dueDate: '' },
  });

  useEffect(() => {
    if (open) reset({ title: '', description: '', priority: 'medium', status: defaultStatus || 'todo', dueDate: '', assignee: '' });
  }, [open, defaultStatus, reset]);

  const priority = watch('priority');
  const status = watch('status');
  const assignee = watch('assignee');

  const onSubmit = (values) => {
    createMutation.mutate(
      {
        projectId,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate || undefined,
        assignee: values.assignee || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" autoFocus placeholder="What needs to be done?" {...register('title')} />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} placeholder="Add detail…" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARD_COLUMNS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setValue('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
            {members.length > 0 && (
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assignee || 'unassigned'} onValueChange={(v) => setValue('assignee', v === 'unassigned' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user?.id} value={m.user?.id}>
                        {m.user?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Spinner />}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTaskDialog;
