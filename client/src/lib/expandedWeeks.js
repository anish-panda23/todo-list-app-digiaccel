import { getWeekStart } from './dates';

// Small per-tab UI memory (sessionStorage) so returning to the home screen
// restores the selected day and which week cards were open.
const EXPANDED = 'weekly-todo:expanded';
const DAY = 'weekly-todo:day';

const keyFor = (date) => getWeekStart(new Date(date)).getTime();

function read(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function loadExpanded() {
  const saved = read(EXPANDED);
  return new Set(Array.isArray(saved) ? saved : []);
}
export const saveExpanded = (set) => write(EXPANDED, [...set]);

export function loadSelectedDay() {
  const saved = read(DAY);
  const d = saved ? new Date(saved) : null;
  return d && !Number.isNaN(d.getTime()) ? d : new Date();
}
export const saveSelectedDay = (date) => write(DAY, date.toISOString());

export { keyFor as weekKeyFor };
