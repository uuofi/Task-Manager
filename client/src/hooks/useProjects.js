import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { projectsApi } from '@/api/projects.api';
import { qk } from '@/lib/queryKeys';

export function useProjects(params = {}) {
  return useQuery({
    queryKey: qk.projects(params),
    queryFn: () => projectsApi.list(params),
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: qk.project(id),
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => projectsApi.update(id, payload),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: qk.project(project.id) });
      toast.success('Project updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useProjectMemberMutations(projectId) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.project(projectId) });

  const addMember = useMutation({
    mutationFn: ({ userId, role }) => projectsApi.addMember(projectId, { userId, role }),
    onSuccess: () => {
      invalidate();
      toast.success('Member added to project');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const removeMember = useMutation({
    mutationFn: (userId) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => {
      invalidate();
      toast.success('Member removed from project');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return { addMember, removeMember };
}

export function useLeaveProject(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => projectsApi.leave(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('You left the project');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useProjectLifecycle() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['projects'] });

  const archive = useMutation({
    mutationFn: projectsApi.archive,
    onSuccess: () => {
      invalidate();
      toast.success('Project archived');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const restore = useMutation({
    mutationFn: projectsApi.restore,
    onSuccess: () => {
      invalidate();
      toast.success('Project restored');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: projectsApi.remove,
    onSuccess: () => {
      invalidate();
      toast.success('Project deleted');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return { archive, restore, remove };
}
