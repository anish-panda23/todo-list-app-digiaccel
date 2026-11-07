import { ArrowLeft, Check, Flag } from 'lucide-react';
import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';

const PRIORITY_STYLES = {
  high: 'bg-pending-bg text-pending-fg',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-emerald-50 text-emerald-600',
};

export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

export function PriorityBadge({ priority, className }) {
  if (!priority) return null;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
        PRIORITY_STYLES[priority],
        className,
      )}
    >
      <Flag className="h-2.5 w-2.5" aria-hidden />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

/** Square checkbox from the design: blue outline, blue tick when completed. */
export function StatusCheck({ completed, onToggle, size = 'md', disabled }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={completed}
      aria-label={completed ? 'Mark as in progress' : 'Mark as completed'}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={clsx(
        'grid shrink-0 place-items-center rounded-[3px] border-[1.5px] border-brand-500 transition active:scale-90',
        size === 'lg' ? 'h-6 w-6' : 'h-[18px] w-[18px]',
        completed ? 'bg-brand-50 text-brand-500' : 'bg-white text-transparent hover:bg-brand-50',
      )}
    >
      <Check className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} strokeWidth={3} />
    </button>
  );
}

export function ProgressBar({ value, className, size = 'lg' }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className={clsx('overflow-hidden bg-brand-100', size === 'lg' ? 'h-5' : 'h-1.5 rounded-full', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Completed tasks"
    >
      <div
        className={clsx('h-full bg-brand-800 transition-[width] duration-500', size !== 'lg' && 'rounded-full')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Highlights every case-insensitive occurrence of `query` within `text`. */
export function Highlight({ text, query }) {
  if (!query || !text) return text ?? null;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts = [];
  let i = 0;
  for (let at = lower.indexOf(q); at !== -1; at = lower.indexOf(q, i)) {
    if (at > i) parts.push(text.slice(i, at));
    parts.push(
      <mark key={at} className="rounded-sm bg-brand-100 px-0.5 text-brand-800">
        {text.slice(at, at + q.length)}
      </mark>,
    );
    i = at + q.length;
  }
  parts.push(text.slice(i));
  return parts;
}

export function Skeleton({ className }) {
  return <div className={clsx('animate-pulse rounded bg-ink/[0.06]', className)} />;
}

/** Back arrow that returns to the previous screen, or `fallback` on a fresh load. */
export function BackButton({ fallback = '/' }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <button
      type="button"
      className="icon-btn -ml-2"
      aria-label="Back"
      onClick={() => (location.key !== 'default' ? navigate(-1) : navigate(fallback))}
    >
      <ArrowLeft className="h-6 w-6" strokeWidth={1.75} />
    </button>
  );
}

export function PageHeader({ title, right }) {
  return (
    <header className="sticky top-0 z-20 -mx-5 flex items-center gap-2 bg-white/95 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] backdrop-blur">
      <BackButton />
      <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
      {right}
    </header>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex animate-fade-in flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-500">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h2 className="text-sm font-semibold">{title}</h2>
      {body && <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded border border-pending-fg/20 bg-pending-bg p-4 text-sm text-pending-fg">
      <p className="font-semibold">Couldn't load tasks</p>
      <p className="mt-0.5">{error?.message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 font-semibold underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}
