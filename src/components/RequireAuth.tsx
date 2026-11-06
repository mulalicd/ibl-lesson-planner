import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIdleSignOut } from '@/hooks/useIdleSignOut';

/**
 * Route guard (P1). Signed-out visitors are sent to /login. Signed-in users
 * get the 30-minute idle sign-out with a 60-second warning (DL-P06 item 5).
 * Uses only the five IDSS brand tokens (CONSTITUTION rule 6).
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useAuth();
  const location = useLocation();
  const { warning, stayActive } = useIdleSignOut(!!session, () => {
    void signOut().then(() => {
      window.location.assign('/login?razlog=neaktivnost');
    });
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black text-brand-yellow flex items-center justify-center" role="status" aria-live="polite">
        <span className="text-brand-yellow text-sm font-semibold">Provjera prijave…</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return (
    <>
      {children}
      {warning && (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-label="Upozorenje o odjavi"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md rounded-xl bg-brand-black border-2 border-brand-yellow p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <p className="text-brand-yellow text-sm flex-1">
            Zbog neaktivnosti bićete odjavljeni za 1 minutu. Nesačuvani plan će se izgubiti.
          </p>
          <button
            type="button"
            onClick={stayActive}
            className="px-4 py-2 rounded-lg bg-brand-yellow text-brand-black text-sm font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lightblue"
          >
            Ostani prijavljen
          </button>
        </div>
      )}
    </>
  );
}
