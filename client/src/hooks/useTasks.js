import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getWeekStart, nextWeekStart } from '../lib/dates';

export const keys = {
  weeks: ['weeks'],
  tasks: ['tasks'],
  week: (weekStart) => ['tasks', 'week', weekStart],
  search: (q) => ['tasks', 'search', q],
  task: (id) => ['task', id],
};

export function useWeeks() {
  return useQuery({ queryKey: keys.weeks, queryFn: api.weeks });
}

export function useWeekTasks(weekStart, { enabled = true } = {}) {
  return useQuery({
    queryKey: keys.week(weekStart),
    queryFn: () =>
      api.list({ from: weekStart, to: nextWeekStart(new Date(weekStart)).toISOString() }),
    enabled,
  });
}

/** Keyword search; an empty query returns all tasks. */
export function useSearchTasks(q) {
  return useQuery({
    queryKey: keys.search(q),
    queryFn: () => api.list({ q }),
    placeholderData: keepPreviousData,
  });
}

export function useTask(id) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.task(id),
    queryFn: () => api.get(id),
    enabled: Boolean(id),
    // Show the task instantly if it's already in any cached list.
    initialData: () => {
      for (const [, list] of qc.getQueriesData({ queryKey: keys.tasks })) {
        const hit = Array.isArray(list) && list.find((t) => t.id === id);
        if (hit) return hit;
      }
      return undefined;
    },
    initialDataUpdatedAt: 0,
  });
}

/* ---------- optimistic cache helpers ---------- */

const weekTime = (task) => getWeekStart(new Date(task.dueAt)).getTime();

/** Move one task's contribution between week summaries (before → after). */
function patchWeeks(weeks, before, after) {
  if (!Array.isArray(weeks)) return weeks;
  const map = new Map(weeks.map((w) => [new Date(w.weekStart).getTime(), { ...w }]));
  const apply = (task, delta) => {
    if (!task) return;
    const key = weekTime(task);
    const w = map.get(key) ?? { weekStart: new Date(key).toISOString(), total: 0, open: 0, completed: 0 };
    const done = task.status === 'completed';
    w.total += delta;
    w.completed += done ? delta : 0;
    w.open += done ? 0 : delta;
    map.set(key, w);
  };
  apply(before, -1);
  apply(after, +1);
  return [...map.entries()]
    .filter(([, w]) => w.total > 0)
    .sort(([a], [b]) => a - b)
    .map(([, w]) => w);
}

function patchLists(list, before, after) {
  if (!Array.isArray(list)) return list;
  return after
    ? list.map((t) => (t.id === after.id ? after : t))
    : list.filter((t) => t.id !== before.id);
}

async function optimistic(qc, before, after) {
  await Promise.all([
    qc.cancelQueries({ queryKey: keys.weeks }),
    qc.cancelQueries({ queryKey: keys.tasks }),
  ]);
  const snapshot = [
    ...qc.getQueriesData({ queryKey: keys.weeks }),
    ...qc.getQueriesData({ queryKey: keys.tasks }),
    [keys.task(before.id), qc.getQueryData(keys.task(before.id))],
  ];
  qc.setQueryData(keys.weeks, (w) => patchWeeks(w, before, after));
  qc.setQueriesData({ queryKey: keys.tasks }, (l) => patchLists(l, before, after));
  if (after) qc.setQueryData(keys.task(after.id), after);
  return { snapshot };
}

function rollback(qc, ctx) {
  ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
}

function refresh(qc) {
  qc.invalidateQueries({ queryKey: keys.weeks });
  qc.invalidateQueries({ queryKey: keys.tasks });
}

/* ---------- mutations ---------- */

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.create,
    onSuccess: (task) => qc.setQueryData(keys.task(task.id), task),
    onSettled: () => refresh(qc),
  });
}

/** `mutate({ task, changes })` — `task` is the current version, used for optimistic UI. */
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ task, changes }) => api.update(task.id, changes),
    onMutate: ({ task, changes }) => optimistic(qc, task, { ...task, ...changes }),
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSuccess: (task) => qc.setQueryData(keys.task(task.id), task),
    onSettled: () => refresh(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task) => api.remove(task.id),
    onMutate: (task) => optimistic(qc, task, null),
    onError: (_err, _task, ctx) => rollback(qc, ctx),
    onSuccess: (_res, task) => qc.removeQueries({ queryKey: keys.task(task.id) }),
    onSettled: () => refresh(qc),
  });
}
