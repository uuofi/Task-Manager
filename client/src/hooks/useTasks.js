import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { tasksApi } from '@/api/tasks.api';
import { qk } from '@/lib/queryKeys';

export function useBoard(projectId) {
  return useQuery({
    queryKey: qk.board(projectId),
    queryFn: () => tasksApi.board(projectId),
    enabled: !!projectId,
  });
}

export function useTask(id) {
  return useQuery({
    queryKey: qk.task(id),
    queryFn: () => tasksApi.get(id),
    enabled: !!id,
  });
}

export function useTaskList(params) {
  return useQuery({
    queryKey: qk.tasks(params),
    queryFn: () => tasksApi.list(params),
  });
}

/** Bundled task mutations; invalidates the affected board + task caches. */
export function useTaskMutations(projectId) {
  const qc = useQueryClient();
  const invalidateBoard = () => projectId && qc.invalidateQueries({ queryKey: qk.board(projectId) });
  const invalidateTask = (id) => qc.invalidateQueries({ queryKey: qk.task(id) });

  const create = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      invalidateBoard();
      toast.success('Task created');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => tasksApi.update(id, payload),
    onSuccess: (task) => {
      invalidateBoard();
      invalidateTask(task.id);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const move = useMutation({
    mutationFn: ({ id, payload }) => tasksApi.move(id, payload),
    onError: (e) => toast.error(getErrorMessage(e)),
    onSettled: () => invalidateBoard(),
  });

  const remove = useMutation({
    mutationFn: tasksApi.remove,
    onSuccess: () => {
      invalidateBoard();
      toast.success('Task deleted');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return { create, update, move, remove };
}
