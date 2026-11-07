import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Clock, SquarePen, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import SwipeableRow from './SwipeableRow';
import { Highlight, PriorityBadge, StatusCheck } from './ui';
import { formatDue, formatTime } from '../lib/dates';
import { useTaskActions } from '../hooks/useTaskActions';
import { useSheetLink } from '../hooks/useSheet';

export default function TaskItem({ task, query, showDate = false }) {
  const navigate = useNavigate();
  const sheet = useSheetLink();
  const { toggleStatus, remove } = useTaskActions();
  const due = new Date(task.dueAt);
  const done = task.status === 'completed';
  const edit = sheet(`/tasks/${task.id}/edit`);

  return (
    <li className="animate-fade-in border-b border-line last:border-b-0">
      <SwipeableRow
        actions={[
          {
            label: 'Edit',
            icon: <SquarePen className="h-4 w-4" />,
            className: 'bg-brand-500',
            onClick: () => navigate(edit.to, { state: edit.state }),
          },
          {
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            className: 'bg-pending-fg',
            onClick: () => remove(task),
          },
        ]}
      >
        <div className="flex items-center gap-3 bg-white py-3.5">
          <StatusCheck completed={done} onToggle={() => toggleStatus(task)} />
          <Link to={`/tasks/${task.id}`} className="min-w-0 flex-1 rounded-sm outline-offset-4" draggable={false}>
            <p
              className={clsx(
                'break-words text-sm font-medium leading-snug',
                done && 'text-ink-muted line-through decoration-ink',
              )}
            >
              <Highlight text={task.title} query={query} />
            </p>
            {query && task.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                <Highlight text={task.description} query={query} />
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
              <span className="inline-flex items-center gap-1 text-ink-faint">
                <Clock className="h-3 w-3" />
                {showDate ? formatDue(due) : formatTime(due)}
              </span>
              <PriorityBadge priority={task.priority} />
            </div>
          </Link>
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => remove(task)}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-faint transition hover:bg-pending-bg hover:text-pending-fg"
              aria-label={`Delete ${task.title}`}
            >
              <Trash2 className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <Link
              {...edit}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-faint transition hover:bg-brand-50 hover:text-brand-500"
              aria-label={`Edit ${task.title}`}
              draggable={false}
            >
              <SquarePen className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </SwipeableRow>
    </li>
  );
}
