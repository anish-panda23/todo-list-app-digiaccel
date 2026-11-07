import { useId } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Plus } from 'lucide-react';
import clsx from 'clsx';
import TaskItem from './TaskItem';
import { ErrorState, ProgressBar, Skeleton } from './ui';
import { useWeekTasks } from '../hooks/useTasks';
import { useSheetLink } from '../hooks/useSheet';
import { formatDay, formatWeekRange, groupByDay, relativeWeekLabel } from '../lib/dates';

/** Summary card for one Monday–Sunday week. Click to expand its tasks. */
export default function WeekCard({ week, expanded, onToggle }) {
  const panelId = useId();
  const sheet = useSheetLink();
  const start = new Date(week.weekStart);
  const label = relativeWeekLabel(start);
  const range = formatWeekRange(start);
  const progress = week.total ? week.completed / week.total : 0;

  return (
    <section className={clsx('rounded border bg-white transition', expanded ? 'border-brand-200' : 'border-line')}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="w-full rounded p-4 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{label ?? range}</h3>
            {label && <p className="text-[11px] text-ink-muted">{range}</p>}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className="rounded bg-pending-bg px-2 py-1 text-pending-fg">
              <b className="font-semibold tabular-nums">{week.open}</b> Open
            </span>
            <span className="rounded bg-brand-50 px-2 py-1 text-brand-700">
              <b className="font-semibold tabular-nums">{week.completed}</b> Completed
            </span>
            <ChevronDown
              className={clsx('h-4 w-4 shrink-0 text-ink-muted transition-transform', expanded && 'rotate-180')}
              aria-hidden
            />
          </div>
        </div>
        <ProgressBar value={progress} size="sm" className="mt-3" />
      </button>

      {expanded && (
        <div id={panelId} className="animate-fade-in border-t border-line px-4 pb-3">
          <WeekTasks weekStart={week.weekStart} />
          <Link
            {...sheet(`/tasks/new?week=${encodeURIComponent(week.weekStart)}`)}
            className="mt-2 flex items-center justify-center gap-1.5 rounded border border-dashed border-brand-300 py-2.5 text-xs font-medium text-brand-500 transition hover:bg-brand-50"
          >
            <Plus className="h-4 w-4" /> Add task to this week
          </Link>
        </div>
      )}
    </section>
  );
}

function WeekTasks({ weekStart }) {
  const { data, isPending, isError, error, refetch } = useWeekTasks(weekStart);

  if (isPending) {
    return (
      <div className="space-y-2 py-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }
  if (isError) return <div className="py-3"><ErrorState error={error} onRetry={refetch} /></div>;
  if (!data.length) return <p className="py-4 text-center text-xs text-ink-muted">No tasks this week.</p>;

  return (
    <div className="pt-1">
      {groupByDay(data).map(({ day, tasks }) => (
        <div key={day.toDateString()} className="pt-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{formatDay(day)}</h4>
          <ul>
            {tasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
