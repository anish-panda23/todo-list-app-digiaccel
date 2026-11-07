import { SquareCheck, SquareX } from 'lucide-react';
import clsx from 'clsx';

export default function SummaryCards({ completed, pending, caption }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card
        icon={SquareCheck}
        title="Task Complete"
        value={completed}
        caption={caption}
        className="bg-brand-50"
        iconClass="bg-brand-200/70 text-brand-800"
      />
      <Card
        icon={SquareX}
        title="Task Pending"
        value={pending}
        caption={caption}
        className="bg-pending-bg"
        iconClass="bg-pending-fg/20 text-pending-fg"
      />
    </div>
  );
}

function Card({ icon: Icon, title, value, caption, className, iconClass }) {
  return (
    <div className={clsx('rounded-sm px-3 py-4 sm:px-4', className)}>
      <div className="flex items-center gap-2.5">
        <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-sm', iconClass)}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="text-xs font-medium leading-tight">{title}</span>
      </div>
      <p className="mt-2 flex items-baseline gap-2 pl-1 sm:pl-11">
        <span className="text-2xl font-semibold tabular-nums">{String(value).padStart(2, '0')}</span>
        <span className="text-[10px] text-ink-muted">{caption}</span>
      </p>
    </div>
  );
}
