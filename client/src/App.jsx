import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import TaskDetailPage from './pages/TaskDetailPage';
import OnboardingPage, { hasOnboarded } from './pages/OnboardingPage';
import TaskSheet from './components/TaskSheet';
import { EmptyState } from './components/ui';

function ScrollToTop({ pathname }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Home() {
  return hasOnboarded() ? <HomePage /> : <Navigate to="/welcome" replace />;
}

export default function App() {
  const location = useLocation();
  // When a sheet is opened from a screen, keep rendering that screen behind it.
  const background = location.state?.background;
  const pageLocation = background ?? location;

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-white px-5 md:my-0 md:max-w-lg md:shadow-[0_0_60px_rgba(0,0,0,0.06)]">
      <ScrollToTop pathname={pageLocation.pathname} />
      <Routes location={pageLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/welcome" element={<OnboardingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        {/* Direct loads of sheet URLs fall back to a sensible screen behind them. */}
        <Route path="/tasks/new" element={<><HomePage /><TaskSheet /></>} />
        <Route path="/tasks/:id/edit" element={<><TaskDetailPage /><TaskSheet /></>} />
        <Route
          path="*"
          element={
            <EmptyState
              icon={Compass}
              title="Page not found"
              action={<Link to="/" className="btn-primary">Go home</Link>}
            />
          }
        />
      </Routes>
      {background && (
        <Routes>
          <Route path="/tasks/new" element={<TaskSheet />} />
          <Route path="/tasks/:id/edit" element={<TaskSheet />} />
        </Routes>
      )}
    </main>
  );
}
