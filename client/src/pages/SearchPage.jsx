import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ClipboardList, Search, SearchX, X } from 'lucide-react';
import clsx from 'clsx';
import TaskItem from '../components/TaskItem';
import { BackButton, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { useSearchTasks } from '../hooks/useTasks';

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function SearchPage() {
  // Query lives in the URL so returning from a result restores the search.
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const [input, setInput] = useState(params.get('q') ?? '');
  const q = useDebounced(input.trim(), 200);
  const { data, isPlaceholderData, isPending, isError, error, refetch } = useSearchTasks(q);

  // Only touch the URL while it's ours (not while an edit sheet is open on top).
  const onSearchRoute = pathname === '/search';
  useEffect(() => {
    if (!onSearchRoute) return;
    setParams(q ? { q } : {}, { replace: true });
  }, [q, setParams, onSearchRoute]);

  return (
    <>
      <header className="sticky top-0 z-20 -mx-5 space-y-5 bg-white/95 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] backdrop-blur">
        <BackButton />
        <form role="search" className="relative" onSubmit={(e) => e.preventDefault()}>
          <input
            type="search"
            autoFocus
            className="field py-3.5 pr-20 text-xs [&::-webkit-search-cancel-button]:hidden"
            placeholder="Search for a task"
            aria-label="Search tasks"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            enterKeyHint="search"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-faint hover:bg-brand-50"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Search className="mx-1.5 h-5 w-5" strokeWidth={1.75} aria-hidden />
          </div>
        </form>
      </header>

      <div className="pb-10">
        {isPending ? (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.length === 0 ? (
          q ? (
            <EmptyState
              icon={SearchX}
              title="No matching tasks"
              body={`Nothing found for “${q}”. Search looks at task titles and descriptions.`}
            />
          ) : (
            <EmptyState icon={ClipboardList} title="No tasks yet" body="Tasks you add will show up here." />
          )
        ) : (
          <>
            <p className={clsx('pt-1 text-[11px] text-ink-faint transition', isPlaceholderData && 'opacity-50')} aria-live="polite">
              {q ? `${data.length} result${data.length === 1 ? '' : 's'}` : `All tasks (${data.length})`}
            </p>
            <ul className={clsx('transition', isPlaceholderData && 'opacity-60')}>
              {data.map((t) => (
                <TaskItem key={t.id} task={t} query={q} showDate />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
