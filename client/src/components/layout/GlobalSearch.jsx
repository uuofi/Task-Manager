import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Hash, ListChecks, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { searchApi } from '@/api/misc.api';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { qk } from '@/lib/queryKeys';

/** Debounce a changing value. */
function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function GlobalSearch({ open, onOpenChange }) {
  const [term, setTerm] = useState('');
  const debounced = useDebounced(term);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: qk.search(debounced),
    queryFn: () => searchApi.query(debounced),
    enabled: debounced.trim().length >= 2,
  });

  useEffect(() => {
    if (!open) setTerm('');
  }, [open]);

  const go = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  const hasResults =
    data && (data.projects?.length || data.tasks?.length || data.users?.length || data.tags?.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="top-24 max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search projects, tasks, people…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isFetching && <Spinner className="text-muted-foreground" />}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {debounced.trim().length < 2 && (
            <p className="text-muted-foreground p-6 text-center text-sm">
              Type at least 2 characters to search.
            </p>
          )}
          {debounced.trim().length >= 2 && !isFetching && !hasResults && (
            <p className="text-muted-foreground p-6 text-center text-sm">No results found.</p>
          )}

          {data?.projects?.length > 0 && (
            <Section title="Projects">
              {data.projects.map((p) => (
                <Row key={p.id} onClick={() => go(`/app/projects/${p.id}`)}>
                  <FolderKanban className="size-4" style={{ color: p.color }} />
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground ml-auto text-xs">{p.key}</span>
                </Row>
              ))}
            </Section>
          )}

          {data?.tasks?.length > 0 && (
            <Section title="Tasks">
              {data.tasks.map((t) => (
                <Row key={t.id} onClick={() => go(`/app/tasks/${t.id}`)}>
                  <ListChecks className="size-4" />
                  <span className="truncate">{t.title}</span>
                  <span className="text-muted-foreground ml-auto text-xs">{t.key}</span>
                </Row>
              ))}
            </Section>
          )}

          {data?.users?.length > 0 && (
            <Section title="People">
              {data.users.map((u) => (
                <Row key={u.id} onClick={() => go('/app/team')}>
                  <UserAvatar user={u} className="size-5" />
                  <span>{u.name}</span>
                  <span className="text-muted-foreground ml-auto text-xs">{u.email}</span>
                </Row>
              ))}
            </Section>
          )}

          {data?.tags?.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-1.5 px-2 py-1">
                {data.tags.map((tag) => (
                  <span key={tag} className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                    <Hash className="size-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-2">
      <p className="text-muted-foreground px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
    >
      {children}
    </button>
  );
}

export default GlobalSearch;
