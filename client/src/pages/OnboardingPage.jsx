import { useNavigate } from 'react-router-dom';

export const ONBOARDED_KEY = 'weekly-todo:onboarded';

export function hasOnboarded() {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return true; // storage blocked: don't trap the user on this screen
  }
}

function Zigzag({ className }) {
  return (
    <svg viewBox="0 0 106 72" className={className} fill="none" aria-hidden>
      {[0, 18, 36, 54].map((y) => (
        <path
          key={y}
          d={`M2 ${y + 14} L15 ${y + 3} L28 ${y + 14} L41 ${y + 3} L54 ${y + 14} L67 ${y + 3} L80 ${y + 14} L93 ${y + 3} L104 ${y + 12}`}
          stroke="currentColor"
          strokeWidth="5"
          strokeLinejoin="miter"
        />
      ))}
    </svg>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();

  const start = () => {
    try {
      localStorage.setItem(ONBOARDED_KEY, '1');
    } catch {
      /* ignore */
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="-mx-5 flex min-h-dvh flex-col">
      <div className="relative flex-[2] overflow-hidden bg-brand-500">
        <div className="absolute -right-8 -top-12 h-28 w-28 rounded-full border-[14px] border-brand-400/80" />
        <Zigzag className="absolute left-0 top-[18%] w-24 text-white/20 sm:w-28" />
        <Zigzag className="absolute bottom-6 right-0 w-24 text-white/20 sm:w-28" />
      </div>
      <div className="flex flex-1 flex-col bg-white px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8">
        <h1 className="text-2xl font-semibold">Manage What To Do</h1>
        <p className="mt-4 max-w-[260px] text-xs leading-relaxed text-ink-muted">
          The best way to manage what you have to do, don't forget your plans
        </p>
        <button type="button" onClick={start} className="btn-primary mt-auto w-full rounded-none">
          Get Started
        </button>
      </div>
    </div>
  );
}
