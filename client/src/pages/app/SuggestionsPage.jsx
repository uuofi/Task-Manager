import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Lightbulb, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { suggestionsApi, workspacesApi } from '@/api/misc.api';
import { projectsApi } from '@/api/projects.api';
import { EmptyState } from '@/components/common/EmptyState';
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
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { relativeTime } from '@/lib/format';

function SuggestDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', suggestedTo: '', priority: 'medium' });
  const { data: members } = useQuery({ queryKey: ['workspace', 'members'], queryFn: workspacesApi.members });

  const create = useMutation({
    mutationFn: () => suggestionsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suggestions'] });
      toast.success('Suggestion sent');
      setOpen(false);
      setForm({ title: '', description: '', suggestedTo: '', priority: 'medium' });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="cta">
          <Plus className="size-4" /> Suggest a task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggest a task to a teammate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Idea for…" />
          </div>
          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={form.suggestedTo} onValueChange={(v) => setForm({ ...form, suggestedTo: v })}>
                <SelectTrigger><SelectValue placeholder="Teammate" /></SelectTrigger>
                <SelectContent>
                  {members?.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>{m.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!form.title || !form.suggestedTo || create.isPending}>
            {create.isPending && <Spinner />} Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceivedCard({ s }) {
  const qc = useQueryClient();
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.list() });
  const [projectId, setProjectId] = useState('');
  const invalidate = () => qc.invalidateQueries({ queryKey: ['suggestions'] });
  const accept = useMutation({ mutationFn: () => suggestionsApi.accept(s.id, projectId || s.project?.id), onSuccess: () => { invalidate(); toast.success('Added to your tasks'); }, onError: (e) => toast.error(getErrorMessage(e)) });
  const reject = useMutation({ mutationFn: () => suggestionsApi.reject(s.id), onSuccess: invalidate });

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start gap-3">
          <UserAvatar user={s.suggestedBy} className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="text-sm"><span className="font-medium">{s.suggestedBy?.name}</span> suggested</p>
            <p className="font-medium">{s.title}</p>
            {s.description && <p className="text-muted-foreground text-sm">{s.description}</p>}
            <p className="text-muted-foreground mt-1 text-xs">{relativeTime(s.createdAt)}</p>
          </div>
          <Badge variant="secondary" className="capitalize">{s.priority}</Badge>
        </div>
        {s.status === 'pending' ? (
          <div className="flex items-center gap-2">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger size="sm" className="flex-1"><SelectValue placeholder="Choose project" /></SelectTrigger>
              <SelectContent>
                {(projects?.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => accept.mutate()} disabled={!projectId && !s.project?.id}>
              <Check className="size-4" /> Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => reject.mutate()}>
              <X className="size-4" /> Decline
            </Button>
          </div>
        ) : (
          <Badge variant={s.status === 'accepted' ? 'success' : 'secondary'} className="capitalize">{s.status}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function SuggestionsPage() {
  const { data: received } = useQuery({ queryKey: ['suggestions', 'received'], queryFn: () => suggestionsApi.received() });
  const { data: sent } = useQuery({ queryKey: ['suggestions', 'sent'], queryFn: () => suggestionsApi.sent() });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader title="Task suggestions" description="Ideas you've shared and received." actions={<SuggestDialog />} />

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="space-y-3">
          {received?.data?.length ? (
            received.data.map((s) => <ReceivedCard key={s.id} s={s} />)
          ) : (
            <EmptyState icon={Lightbulb} title="No suggestions yet" description="When teammates suggest tasks, they'll appear here." />
          )}
        </TabsContent>
        <TabsContent value="sent" className="space-y-3">
          {sent?.data?.length ? (
            sent.data.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex items-center gap-3 py-4">
                  <UserAvatar user={s.suggestedTo} className="size-8" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-muted-foreground text-xs">To {s.suggestedTo?.name} · {relativeTime(s.createdAt)}</p>
                  </div>
                  <Badge variant={s.status === 'accepted' ? 'success' : s.status === 'rejected' ? 'secondary' : 'warning'} className="capitalize">
                    {s.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState icon={Lightbulb} title="Nothing sent yet" description="Suggest a task to a teammate to get started." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SuggestionsPage;
