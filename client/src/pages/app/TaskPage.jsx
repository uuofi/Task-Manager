import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { TaskDetailDialog } from '@/components/board/TaskDetailDialog';
import { FullPageLoader } from '@/components/common/FullPageLoader';
import { useSocket } from '@/contexts/SocketContext';
import { useProject } from '@/hooks/useProjects';
import { useTask } from '@/hooks/useTasks';

/**
 * Standalone task view (reached from dashboard / search / notification links).
 * Reuses the task detail dialog; closing returns to the previous screen.
 */
export function TaskPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(taskId);
  const projectId = task?.project?.id || task?.project;
  const { data: project } = useProject(projectId);
  const { joinProject, leaveProject } = useSocket();

  useEffect(() => {
    if (!projectId) return undefined;
    joinProject(projectId);
    return () => leaveProject(projectId);
  }, [projectId, joinProject, leaveProject]);

  if (isLoading) return <FullPageLoader label="Loading task…" />;

  return (
    <TaskDetailDialog
      taskId={taskId}
      members={project?.members ?? []}
      open
      onOpenChange={(v) => !v && navigate(-1)}
    />
  );
}

export default TaskPage;
