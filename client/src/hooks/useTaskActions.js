import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { keys, useDeleteTask, useUpdateTask } from './useTasks';

/** Toggle completed/in-progress and delete-with-undo, with toasts. */
export function useTaskActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const update = useUpdateTask();
  const del = useDeleteTask();

  const toggleStatus = useCallback(
    (task) => {
      const status = task.status === 'completed' ? 'in_progress' : 'completed';
      update.mutate(
        { task, changes: { status } },
        { onError: (err) => toast.show({ message: err.message, tone: 'error' }) },
      );
    },
    [update, toast],
  );

  const remove = useCallback(
    // mutateAsync (not mutate + callbacks): the row unmounts as soon as the
    // optimistic update removes it, and per-call callbacks would never fire.
    async (task, { onDeleted } = {}) => {
      try {
        await del.mutateAsync(task);
      } catch (err) {
        toast.show({ message: err.message, tone: 'error' });
        return;
      }
      onDeleted?.();
      toast.show({
        message: `“${task.title}” deleted`,
        action: {
          label: 'Undo',
          // Uses the API directly so it still works after this screen unmounts.
          onClick: async () => {
            try {
              const { title, description, dueAt, priority, status } = task;
              await api.create({ title, description, dueAt, priority, status });
            } catch (err) {
              toast.show({ message: err.message, tone: 'error' });
            } finally {
              qc.invalidateQueries({ queryKey: keys.weeks });
              qc.invalidateQueries({ queryKey: keys.tasks });
            }
          },
        },
      });
    },
    [del, toast, qc],
  );

  return { toggleStatus, remove };
}
