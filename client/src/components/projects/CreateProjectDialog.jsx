import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProject } from '@/hooks/useProjects';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  key: z
    .string()
    .regex(/^[A-Za-z0-9]{2,6}$/, '2–6 letters/numbers')
    .optional()
    .or(z.literal('')),
  description: z.string().max(1000).optional(),
  color: z.string(),
});

const COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#10B981'];

export function CreateProjectDialog({ trigger, onCreated }) {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', key: '', description: '', color: COLORS[0] },
  });
  const color = watch('color');

  const onSubmit = (values) => {
    const payload = { ...values, key: values.key || undefined };
    createProject.mutate(payload, {
      onSuccess: (project) => {
        setOpen(false);
        reset();
        onCreated?.(project);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>Organize work into a focused board.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" placeholder="Marketing Website" {...register('name')} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="key">Key (optional)</Label>
            <Input id="key" placeholder="MKT" className="uppercase" {...register('key')} />
            {errors.key && <p className="text-destructive text-xs">{errors.key.message}</p>}
            <p className="text-muted-foreground text-xs">Used in task IDs, e.g. MKT-12.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} placeholder="What is this project about?" {...register('description')} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setValue('color', c)}
                  className={`size-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-ring scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Pick ${c}`}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="cta" disabled={createProject.isPending}>
              {createProject.isPending && <Spinner />}
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateProjectDialog;
