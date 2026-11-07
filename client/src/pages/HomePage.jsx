import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSameDay, isToday } from 'date-fns';
import { CalendarCheck, ClipboardList, Plus, Search } from 'lucide-react';
import TaskItem from '../components/TaskItem';
import WeekCard from '../components/WeekCard';
import WeekStrip from '../components/WeekStrip';
import SummaryCards from '../components/SummaryCards';
import { EmptyState, ErrorState, ProgressBar, Skeleton } from '../components/ui';
import { useWeekTasks, useWeeks } from '../hooks/useTasks';
import { TASK_SAVED_EVENT, useSheetLink } from '../hooks/useSheet';
import { formatDay, getWeekStart, groupByDay, relativeWeekLabel } from '../lib/dates';
import {
  loadExpanded,
  loadSelectedDay,
  saveExpanded,
  saveSelectedDay,
  weekKeyFor,
} from '../lib/expandedWeeks';

export default function HomePage() {
  const sheet = useSheetLink();
  const [selected, setSelected] = useState(loadSelectedDay);
  const [viewAll, setViewAll] = useState(false);
  const [expanded, setExpanded] = useState(loadExpanded);

  const weekStart = getWeekStart(selected).toISOString();
  const weekTasks = useWeekTasks(weekStart);
  const weeks = useWeeks();

  useEffect(() => {
    saveSelectedDay(selected);
  }, [selected]);
  useEffect(() => {
    saveExpanded(expanded);
  }, [expanded]);

  // Jump to the day of a task that was just created/edited in the sheet.
  useEffect(() => {
    const onSaved = (e) => setSelected(new Date(e.detail));
    window.addEventListener(TASK_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(TASK_SAVED_EVENT, onSaved);
  }, []);

  const tasks = weekTasks.data ?? [];
  const busyDays = useMemo(() => new Set(tasks.map((t) => new Date(t.dueAt).toDateString())), [tasks]);
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const pending = tasks.length - completed;
  const dayTasks = tasks.filter((t) => isSameDay(new Date(t.dueAt), selected));
  const weekLabel = relativeWeekLabel(new Date(weekStart));
  const caption = weekLabel === 'This week' ? 'This Week' : weekLabel ?? 'That Week';

  const toggleWeek = (ws) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      const key = weekKeyFor(ws);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // This week first, then upcoming weeks (soonest first), then past weeks (latest first).
  const thisWeek = getWeekStart(new Date()).getTime();
  const rank = (w) => {
    const t = new Date(w.weekStart).getTime();
    return t === thisWeek ? [0, 0] : t > thisWeek ? [1, t] : [2, -t];
  };
  const allWeeks = [...(weeks.data ?? [])].sort((a, b) => {
    const [ga, ta] = rank(a);
    const [gb, tb] = rank(b);
    return ga - gb || ta - tb;
  });

  return (
    <div className="space-y-7 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Link
        to="/search"
        className="flex items-center justify-between rounded border border-line bg-white px-4 py-3 text-xs text-ink-faint transition hover:border-brand-300"
        aria-label="Search for a task"
      >
        Search for a task
        <Search className="h-5 w-5 text-ink" strokeWidth={1.75} />
      </Link>

      <WeekStrip selected={selected} onSelect={setSelected} busyDays={busyDays} />

      {weekTasks.isError ? (
        <ErrorState error={weekTasks.error} onRetry={weekTasks.refetch} />
      ) : weekTasks.isPending ? (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <SummaryCards completed={completed} pending={pending} caption={caption} />
      )}

      <section aria-labelledby="progress-heading">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="progress-heading" className="section-title">
            Weekly Progress
          </h2>
          <span className="text-xs text-ink-muted">
            {completed}/{tasks.length} done
          </span>
        </div>
        <ProgressBar value={tasks.length ? completed / tasks.length : 0} />
      </section>

      <section aria-labelledby="tasks-heading">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 id="tasks-heading" className="section-title">
            {viewAll ? `Tasks ${caption}` : isToday(selected) ? 'Tasks Today' : `Tasks · ${formatDay(selected)}`}
          </h2>
          <button
            type="button"
            onClick={() => setViewAll((v) => !v)}
            className="rounded px-1 text-sm text-brand-500 hover:underline"
          >
            {viewAll ? 'View Day' : 'View All'}
          </button>
        </div>

        {weekTasks.isPending ? (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : viewAll ? (
          tasks.length ? (
            groupByDay(tasks).map(({ day, tasks: list }) => (
              <div key={day.toDateString()} className="pt-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{formatDay(day)}</h3>
                <ul>
                  {list.map((t) => (
                    <TaskItem key={t.id} task={t} />
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <EmptyState icon={ClipboardList} title="Nothing planned this week" body="Tap + to add a task." />
          )
        ) : dayTasks.length ? (
          <ul>
            {dayTasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarCheck}
            title={isToday(selected) ? 'No tasks for today' : 'No tasks on this day'}
            body="Tap + to schedule something."
          />
        )}
      </section>

      <section aria-labelledby="weeks-heading">
        <h2 id="weeks-heading" className="section-title mb-3">
          All Weeks
        </h2>
        {weeks.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : weeks.isError ? (
          <ErrorState error={weeks.error} onRetry={weeks.refetch} />
        ) : allWeeks.length === 0 ? (
          <p className="rounded border border-dashed border-line py-6 text-center text-xs text-ink-muted">
            Your weekly summaries will appear here once you add tasks.
          </p>
        ) : (
          <div className="space-y-3">
            {allWeeks.map((w) => (
              <WeekCard
                key={w.weekStart}
                week={w}
                expanded={expanded.has(weekKeyFor(w.weekStart))}
                onToggle={() => toggleWeek(w.weekStart)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Link
          {...sheet(`/tasks/new?day=${encodeURIComponent(selected.toISOString())}`)}
          className="pointer-events-auto grid h-16 w-16 place-items-center rounded-full bg-brand-500 text-white shadow-fab transition hover:bg-brand-600 active:scale-95"
          aria-label="Add Task"
        >
          <Plus className="h-7 w-7" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
