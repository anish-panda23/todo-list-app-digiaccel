import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarDays, CheckCircle2, Clock, FileQuestion, Flag, SquarePen, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { EmptyState, ErrorState, PageHeader, PriorityBadge, Skeleton, StatusCheck } from '../components/ui';
import { useTask } from '../hooks/useTasks';
import { useTaskActions } from '../hooks/useTaskActions';
import { useSheetLink } from '../hooks/useSheet';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sheet = useSheetLink();
  const { data: task, isPending, isError, error, refetch } = useTask(id);
  const { toggleStatus, remove } = useTaskActions();

  if (isPending) {
    return (
      <>
        <PageHeader title="Task details" />
        <Skeleton className="h-64" />
      </>
    );
  }
  if (isError) {
    return (
      <>
        <PageHeader title="Task details" />
        {error.status === 404 ? (
          <EmptyState
            icon={FileQuestion}
            title="Task not found"
            body="It may have been deleted."
            action={<Link to="/" className="btn-primary">Go home</Link>}
          />
        ) : (
          <ErrorState error={error} onRetry={refetch} />
        )}
      </>
    );
  }

  const due = new Date(task.dueAt);
  const done = task.status === 'completed';

  return (
    <>
      <PageHeader
        title="Task details"
        right={
          <Link {...sheet(`/tasks/${task.id}/edit`)} className="icon-btn -mr-2" aria-label="Edit task">
            <SquarePen className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        }
      />

      <article className="animate-fade-in space-y-6 pb-10 pt-2">
        <div className="flex items-start gap-3">
          <div className="pt-1">
            <StatusCheck size="lg" completed={done} onToggle={() => toggleStatus(task)} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={clsx('break-words text-xl font-semibold leading-snug', done && 'text-ink-muted line-through')}>
              {task.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium">
              <span className={clsx('rounded px-2 py-0.5', done ? 'bg-brand-50 text-brand-700' : 'bg-pending-bg text-pending-fg')}>
                {done ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <Detail icon={CalendarDays} label="Date" value={format(due, 'EEEE d, MMMM')} />
          <Detail icon={Clock} label="Time" value={format(due, 'h:mm a')} />
          <Detail
            icon={Flag}
            label="Priority"
            value={task.priority ? <PriorityBadge priority={task.priority} /> : <span className="text-ink-faint">None</span>}
          />
          <Detail
            icon={CheckCircle2}
            label={done ? 'Completed on' : 'Created on'}
            value={format(new Date(done && task.completedAt ? task.completedAt : task.createdAt), 'MMM d, h:mm a')}
          />
        </dl>

        <div>
          <h3 className="label">Description</h3>
          {task.description ? (
            <p className="whitespace-pre-wrap break-words rounded border border-line p-3.5 text-sm leading-relaxed">
              {task.description}
            </p>
          ) : (
            <p className="rounded border border-dashed border-line p-3.5 text-sm text-ink-faint">No description.</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => toggleStatus(task)}
            className={done ? 'btn-secondary w-full' : 'btn-primary w-full'}
          >
            {done ? 'Mark as In Progress' : 'Mark as Completed'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <Link {...sheet(`/tasks/${task.id}/edit`)} className="btn-secondary">
              <SquarePen className="h-4 w-4" /> Edit
            </Link>
            <button
              type="button"
              className="btn-danger"
              onClick={() => remove(task, { onDeleted: () => navigate('/', { replace: true }) })}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </article>
    </>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded border border-line p-3">
      <dt className="flex items-center gap-1.5 text-[11px] text-ink-muted">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
