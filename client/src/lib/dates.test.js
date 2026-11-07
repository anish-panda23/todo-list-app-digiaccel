import { describe, expect, it } from 'vitest';
import {
  defaultDueDate,
  formatWeekRange,
  fromInputs,
  getWeekStart,
  groupByDay,
  relativeWeekLabel,
  toInputs,
} from './dates';

// Saturday, Nov 7 2026, 14:20 local time
const NOW = new Date(2026, 10, 7, 14, 20);

describe('week boundaries', () => {
  it('starts weeks on Monday', () => {
    expect(getWeekStart(NOW)).toEqual(new Date(2026, 10, 2));
    // Sunday belongs to the week that started the previous Monday.
    expect(getWeekStart(new Date(2026, 10, 8, 23, 59))).toEqual(new Date(2026, 10, 2));
    expect(getWeekStart(new Date(2026, 10, 9, 0, 0))).toEqual(new Date(2026, 10, 9));
  });

  it('labels relative weeks', () => {
    expect(relativeWeekLabel(new Date(2026, 10, 2), NOW)).toBe('This week');
    expect(relativeWeekLabel(new Date(2026, 10, 9), NOW)).toBe('Next week');
    expect(relativeWeekLabel(new Date(2026, 9, 26), NOW)).toBe('Last week');
    expect(relativeWeekLabel(new Date(2026, 10, 16), NOW)).toBeNull();
  });

  it('formats week ranges', () => {
    expect(formatWeekRange(new Date(2026, 10, 2), NOW)).toBe('Nov 2 – 8');
    expect(formatWeekRange(new Date(2026, 10, 30), NOW)).toBe('Nov 30 – Dec 6');
    expect(formatWeekRange(new Date(2026, 11, 28), NOW)).toBe('Dec 28, 2026 – Jan 3, 2027');
    expect(formatWeekRange(new Date(2027, 1, 1), NOW)).toBe('Feb 1 – 7, 2027');
  });
});

describe('date inputs', () => {
  it('round-trips through input values', () => {
    const d = new Date(2026, 0, 5, 7, 45);
    const { date, time } = toInputs(d);
    expect(date).toBe('2026-01-05');
    expect(time).toBe('07:45');
    expect(fromInputs(date, time)).toEqual(d);
  });

  it('rejects incomplete input', () => {
    expect(fromInputs('', '10:00')).toBeNull();
    expect(fromInputs('2026-01-05', '')).toBeNull();
  });
});

describe('defaultDueDate', () => {
  it('uses the next full hour today', () => {
    expect(defaultDueDate(undefined, NOW)).toEqual(new Date(2026, 10, 7, 15, 0));
    expect(defaultDueDate(new Date(2026, 10, 2), NOW)).toEqual(new Date(2026, 10, 7, 15, 0));
  });

  it("uses Monday 9:00 for other weeks", () => {
    expect(defaultDueDate(new Date(2026, 10, 16), NOW)).toEqual(new Date(2026, 10, 16, 9, 0));
  });

  it('does not roll over to tomorrow late at night', () => {
    expect(defaultDueDate(undefined, new Date(2026, 10, 7, 23, 30))).toEqual(new Date(2026, 10, 7, 23, 59));
  });
});

describe('groupByDay', () => {
  it('groups consecutive tasks by calendar day', () => {
    const tasks = [
      { id: 1, dueAt: new Date(2026, 10, 2, 9).toISOString() },
      { id: 2, dueAt: new Date(2026, 10, 2, 18).toISOString() },
      { id: 3, dueAt: new Date(2026, 10, 4, 9).toISOString() },
    ];
    expect(groupByDay(tasks).map((g) => g.tasks.map((t) => t.id))).toEqual([[1, 2], [3]]);
  });
});
