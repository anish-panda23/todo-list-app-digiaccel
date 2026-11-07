import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

const ACTION_WIDTH = 76;
const DRAG_THRESHOLD = 8;

/**
 * Swipe left to reveal action buttons (Edit / Delete). Uses pointer events,
 * so it works with touch, pen and mouse drag. Vertical scrolling is left to
 * the browser via `touch-action: pan-y`. Actions are also revealed when they
 * receive keyboard focus.
 */
export default function SwipeableRow({ actions, children, className }) {
  const width = actions.length * ACTION_WIDTH;
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const rowRef = useRef(null);
  const drag = useRef(null);
  const offsetRef = useRef(0);
  const suppressClick = useRef(false);

  const setPos = (x) => {
    offsetRef.current = x;
    setOffset(x);
  };

  // Close when the user interacts anywhere else.
  useEffect(() => {
    if (offset === 0) return;
    const onDown = (e) => {
      if (!rowRef.current?.contains(e.target)) setPos(0);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [offset]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, base: offsetRef.current, active: false, id: e.pointerId };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // vertical scroll, let it go
        return;
      }
      d.active = true;
      setDragging(true);
      e.currentTarget.setPointerCapture?.(d.id);
    }
    // Rubber-band past the fully-open position.
    let x = d.base + dx;
    if (x > 0) x = x / 4;
    if (x < -width) x = -width + (x + width) / 4;
    setPos(x);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active) return;
    suppressClick.current = true;
    setDragging(false);
    setPos(offsetRef.current < -width / 2 ? -width : 0);
  };

  const onClickCapture = (e) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    } else if (offsetRef.current !== 0) {
      // A tap on an open row closes it instead of opening the task.
      e.preventDefault();
      e.stopPropagation();
      setPos(0);
    }
  };

  return (
    <div ref={rowRef} className={clsx('relative overflow-hidden', className)}>
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width }}
        onFocus={() => setPos(-width)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setPos(0);
        }}
      >
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => {
              setPos(0);
              a.onClick();
            }}
            className={clsx(
              'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-white',
              a.className,
            )}
            style={{ width: ACTION_WIDTH }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
      <div
        className={clsx(
          'relative touch-pan-y select-none',
          !dragging && 'transition-transform duration-200 ease-out',
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
