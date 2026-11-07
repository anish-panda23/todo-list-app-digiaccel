import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarDays, Clock, X } from 'lucide-react';
import clsx from 'clsx';
import { PRIORITY_LABELS, Skeleton, ErrorState } from './ui';
import { useToast } from './Toast';
import { useCreateTask, useTask, useUpdateTask } from '../hooks/useTasks';
import { TASK_SAVED_EVENT } from '../hooks/useSheet';
import { defaultDueDate, defaultDueOn, fromInputs, toInputs } from '../lib/dates';

const PRIORITY_OPTIONS = [
  { value: null, label: 'None' },
  ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
];
const PRIORITY_ACTIVE = {
  null: 'border-ink bg-ink text-white',
  low: 'border-emerald-500 bg-emerald-500 text-white',
  medium: 'border-amber-500 bg-amber-500 text-white',
  high: 'border-pending-fg bg-pending-fg text-white',
};

/** Bottom sheet used for both "Add New Task" and "Edit Task". */
export default function TaskSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: task, isPending, isError, error } = useTask(id ?? '');

  const close = () => {
    if (location.state?.background) navigate(-1);
    else navigate(id ? `/tasks/${id}` : '/', { replace: true });
  };

  // Escape closes; lock page scroll behind the sheet.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let body;
  if (!id) body = <TaskForm onDone={close} />;
  else if (isPending) body = <div className="space-y-4"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-24" /></div>;
  else if (isError) body = <ErrorState error={error} />;
  else body = <TaskForm task={task} onDone={close} />;

  return (
    <div className="fixed inset-0 z-40" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-black/30" onClick={close} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md md:max-w-lg">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
          className="max-h-[92dvh] animate-sheet-up overflow-y-auto rounded-t-2xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-sheet"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 id="sheet-title" className="text-lg font-semibold">
              {id ? 'Edit Task' : 'Add New Task'}
            </h2>
            <button type="button" onClick={close} className="icon-btn -mr-2" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          {body}
        </div>
      </div>
    </div>
  );
}

function TaskForm({ task, onDone }) {
  const isEdit = Boolean(task);
  const [params] = useSearchParams();
  const toast = useToast();
  const create = useCreateTask();
  const update = useUpdateTask();
  const titleRef = useRef(null);

  const [values, setValues] = useState(() => {
    let due;
    if (task) due = new Date(task.dueAt);
    else if (params.get('day')) due = defaultDueOn(new Date(params.get('day')));
    else due = defaultDueDate(params.get('week') ? new Date(params.get('week')) : undefined);
    if (Number.isNaN(due.getTime())) due = defaultDueDate();
    return {
      title: task?.title ?? '',
      description: task?.description ?? '',
      ...toInputs(due),
      priority: task?.priority ?? null,
      status: task?.status ?? 'in_progress',
    };
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) titleRef.current?.focus();
  }, [isEdit]);

  const set = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((errs) => ({ ...errs, [field]: undefined, dueAt: undefined }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!values.title.trim()) errs.title = 'Task title is required';
    if (!values.time) errs.time = 'Set a time';
    if (!values.date) errs.date = 'Set a date';
    const dueAt = fromInputs(values.date, values.time);
    if (values.date && values.time && !dueAt) errs.date = 'Invalid date';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      dueAt: dueAt.toISOString(),
      priority: values.priority,
      ...(isEdit && { status: values.status }),
    };
    const handlers = {
      onSuccess: () => {
        window.dispatchEvent(new CustomEvent(TASK_SAVED_EVENT, { detail: payload.dueAt }));
        toast.show({ message: isEdit ? 'Changes saved' : 'Task created' });
        onDone();
      },
      onError: (err) => {
        if (err.details) setErrors(err.details);
        toast.show({ message: err.message, tone: 'error' });
      },
    };
    if (isEdit) update.mutate({ task, changes: payload }, handlers);
    else create.mutate(payload, handlers);
  };

  const saving = create.isPending || update.isPending;
  const due = fromInputs(values.date, values.time);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="title" className="label">
          Task title
        </label>
        <input
          id="title"
          ref={titleRef}
          className={clsx('field', errors.title && 'field-error')}
          placeholder="e.g. Doing Homework"
          maxLength={120}
          value={values.title}
          onChange={set('title')}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
          enterKeyHint="next"
        />
        <FieldError id="title-error" message={errors.title} />
      </div>

      <div>
        <label htmlFor="time" className="label">
          Set Time
        </label>
        <PickerField
          id="time"
          type="time"
          icon={Clock}
          value={values.time}
          onChange={set('time')}
          display={due ? format(due, 'h:mm a') : values.time ? values.time : 'Select time'}
          error={errors.time}
        />
        <FieldError message={errors.time} />
      </div>

      <div>
        <label htmlFor="date" className="label">
          Set Date
        </label>
        <PickerField
          id="date"
          type="date"
          icon={CalendarDays}
          iconRight
          value={values.date}
          onChange={set('date')}
          display={due ? format(due, 'EEEE d, MMMM yyyy') : 'Select date'}
          error={errors.date ?? errors.dueAt}
        />
        <FieldError message={errors.date ?? errors.dueAt} />
      </div>

      <fieldset>
        <legend className="label">Priority</legend>
        <div className="grid grid-cols-4 gap-2" role="radiogroup">
          {PRIORITY_OPTIONS.map((opt) => {
            const active = values.priority === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set('priority')(opt.value)}
                className={clsx(
                  'rounded border py-2 text-xs font-medium transition',
                  active ? PRIORITY_ACTIVE[opt.value] : 'border-line text-ink-muted hover:bg-brand-50',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {isEdit && (
        <fieldset>
          <legend className="label">Status</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {[
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ].map((opt) => {
              const active = values.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set('status')(opt.value)}
                  className={clsx(
                    'rounded border py-2 text-xs font-medium transition',
                    active ? 'border-brand-500 bg-brand-500 text-white' : 'border-line text-ink-muted hover:bg-brand-50',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          className={clsx('field min-h-[88px] resize-y', errors.description && 'field-error')}
          placeholder="Add Description"
          maxLength={1000}
          value={values.description}
          onChange={set('description')}
        />
        <FieldError message={errors.description} />
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
      </button>
    </form>
  );
}

/**
 * Shows a friendly formatted value ("Friday 14, January") while keeping the
 * native date/time picker underneath for mobile keyboards & accessibility.
 */
function PickerField({ id, type, icon: Icon, iconRight, value, onChange, display, error }) {
  return (
    <div
      className={clsx(
        'relative flex items-center gap-3 rounded border bg-white px-3.5 py-3 text-sm transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100',
        error ? 'border-rose-400' : 'border-line',
        iconRight && 'flex-row-reverse justify-between',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
      <span className={clsx('flex-1', !value && 'text-ink-faint')} aria-hidden>
        {display}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            /* not supported */
          }
        }}
        aria-invalid={Boolean(error)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-rose-600" role="alert">
      {message}
    </p>
  );
}
