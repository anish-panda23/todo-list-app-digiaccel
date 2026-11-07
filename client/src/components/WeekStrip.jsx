import { addDays, format, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { getWeekStart } from '../lib/dates';

/**
 * Mon → Sun day picker for one week, with arrows to move between weeks.
 * Days that have tasks get a small dot; the selected day is filled blue.
 */
export default function WeekStrip({ selected, onSelect, busyDays }) {
  const start = getWeekStart(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const end = days[6];
  const showToday = !days.some((d) => isToday(d)) || !isToday(selected);
  const monthLabel =
    format(start, 'MMM') === format(end, 'MMM')
      ? format(start, 'MMMM yyyy')
      : `${format(start, 'MMM')} – ${format(end, 'MMM yyyy')}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-ink-muted" aria-live="polite">
          {monthLabel}
        </p>
        <div className="flex items-center gap-1">
          {showToday && (
            <button
              type="button"
              onClick={() => onSelect(new Date())}
              className="rounded px-2 py-1 text-xs font-medium text-brand-500 hover:bg-brand-50"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelect(addDays(selected, -7))}
            className="grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-brand-50"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelect(addDays(selected, 7))}
            className="grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-brand-50"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Days of the week">
        {days.map((day) => {
          const active = isSameDay(day, selected);
          const hasTasks = busyDays.has(day.toDateString());
          return (
            <button
              key={day.toISOString()}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={format(day, 'EEEE, MMMM d') + (hasTasks ? ', has tasks' : '')}
              onClick={() => onSelect(day)}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-sm py-2 transition',
                active ? 'bg-brand-500 text-white' : 'text-ink-faint hover:bg-brand-50',
              )}
            >
              <span className="text-[10px]">{format(day, 'EEE')}</span>
              <span
                className={clsx(
                  'text-sm',
                  active ? 'font-semibold' : isToday(day) ? 'font-semibold text-brand-500' : 'text-ink-muted',
                )}
              >
                {format(day, 'dd')}
              </span>
              <span
                className={clsx(
                  'h-1 w-1 rounded-full',
                  hasTasks ? (active ? 'bg-white' : 'bg-brand-400') : 'bg-transparent',
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
