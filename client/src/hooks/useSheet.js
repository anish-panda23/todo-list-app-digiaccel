import { useLocation } from 'react-router-dom';

/**
 * The add/edit form is a bottom sheet that opens over whatever screen the
 * user is on (React Router's "background location" modal pattern). Spread
 * the result onto a <Link>: `<Link {...sheet('/tasks/new')}>`.
 */
export function useSheetLink() {
  const location = useLocation();
  const background = location.state?.background ?? location;
  return (to) => ({ to, state: { background } });
}

export const TASK_SAVED_EVENT = 'todo:task-saved';
