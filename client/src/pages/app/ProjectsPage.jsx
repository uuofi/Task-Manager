import { FolderPlus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/useProjects';

function ProjectCard({ project, onClick }) {
  return (
    <button onClick={onClick} className="text-left">
      <Card className="h-full gap-3 py-5 transition-shadow hover:shadow-md">
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: project.color }}
            >
              {project.key.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{project.name}</p>
              <p className="text-muted-foreground text-xs">{project.key}</p>
            </div>
            {project.status === 'archived' && (
              <Badge variant="secondary" className="ml-auto">
                Archived
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">{project.description}</p>
          )}
          <div className="flex items-center justify-between pt-1">
            <div className="flex -space-x-2">
              {(project.members ?? []).slice(0, 4).map((m) => (
                <UserAvatar key={m.user?.id || m.user} user={m.user} className="size-6 ring-2 ring-background" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export function ProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useProjects();
  const projects = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title={t('projects.title')}
        description={t('projects.subtitle')}
        actions={
          <CreateProjectDialog
            trigger={
              <Button variant="cta">
                <Plus className="size-4" /> {t('projects.newProject')}
              </Button>
            }
            onCreated={(p) => navigate(`/app/projects/${p.id}`)}
          />
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title={t('projects.noProjects')}
          description={t('projects.noProjectsDesc')}
          action={
            <CreateProjectDialog
              trigger={
                <Button variant="cta">
                  <Plus className="size-4" /> {t('projects.createProject')}
                </Button>
              }
              onCreated={(p) => navigate(`/app/projects/${p.id}`)}
            />
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/app/projects/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
