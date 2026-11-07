import {
  addWeeks,
  differenceInCalendarWeeks,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
  startOfWeek,
} from 'date-fns';

// Weeks run Monday → Sunday.
export const WEEK_OPTS = { weekStartsOn: 1 };

export const getWeekStart = (date) => startOfWeek(date, WEEK_OPTS);
export const getWeekEnd = (date) => endOfWeek(date, WEEK_OPTS);
export const nextWeekStart = (weekStart) => addWeeks(weekStart, 1);
export const weekKey = (weekStart) => getWeekStart(weekStart).toISOString();

/** Relative label ("This week", "Next week", "Last week") or null. */
export function relativeWeekLabel(weekStart, now = new Date()) {
  const diff = differenceInCalendarWeeks(weekStart, now, WEEK_OPTS);
  if (diff === 0) return 'This week';
  if (diff === 1) return 'Next week';
  if (diff === -1) return 'Last week';
  return null;
}

/** "Nov 3 – 9", "Oct 27 – Nov 2", "Dec 29, 2025 – Jan 4, 2026". */
export function formatWeekRange(weekStart, now = new Date()) {
  const start = getWeekStart(weekStart);
  const end = getWeekEnd(start);
  if (!isSameYear(start, end)) {
    return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
  }
  const yearSuffix = isSameYear(start, now) ? '' : `, ${format(start, 'yyyy')}`;
  if (isSameMonth(start, end)) return `${format(start, 'MMM d')} – ${format(end, 'd')}${yearSuffix}`;
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}${yearSuffix}`;
}

export function formatDay(date) {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

export const formatTime = (date) => format(date, 'h:mm a');
export const formatDue = (date) => `${formatDay(date)} · ${formatTime(date)}`;

/** Split a Date into values for <input type="date"> and <input type="time">. */
export const toInputs = (date) => ({ date: format(date, 'yyyy-MM-dd'), time: format(date, 'HH:mm') });

/** Build a local Date from date/time input values; null if incomplete/invalid. */
export function fromInputs(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !/^\d{2}:\d{2}$/.test(time ?? '')) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const result = new Date(y, m - 1, d, hh, mm);
  return Number.isNaN(result.getTime()) ? null : result;
}

/**
 * Sensible default due date for a new task. Inside a given week: today if it
 * falls in that week, otherwise the week's Monday. Time defaults to the next
 * full hour for today, otherwise 9:00.
 */
export function defaultDueDate(weekStart, now = new Date()) {
  let day = now;
  if (weekStart) {
    const start = getWeekStart(weekStart);
    day = isSameDay(getWeekStart(now), start) ? now : start;
  }
  return defaultDueOn(day, now);
}

/** Default due time on a specific day: next full hour if it's today, else 9:00. */
export function defaultDueOn(day, now = new Date()) {
  if (!isSameDay(day, now)) return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0);
  const result = new Date(now);
  result.setHours(now.getHours() + 1, 0, 0, 0);
  return isSameDay(result, now) ? result : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
}

/** Group tasks into [{ day: Date, tasks }] by calendar day, preserving order. */
export function groupByDay(tasks) {
  const groups = [];
  for (const task of tasks) {
    const due = new Date(task.dueAt);
    const last = groups.at(-1);
    if (last && isSameDay(last.day, due)) last.tasks.push(task);
    else groups.push({ day: due, tasks: [task] });
  }
  return groups;
}
