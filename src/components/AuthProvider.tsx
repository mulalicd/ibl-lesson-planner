import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/hooks/useAuth';
import { clearLastActivity, markFreshSignIn } from '@/hooks/useIdleSignOut';

/** Provides sign-in state (P1). See hooks/useAuth.ts. */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // Subscribe first so a magic-link session parsed from the URL is not missed.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Before setSession: the idle guard must see the fresh timestamp, not a stale one
      if (event === 'SIGNED_IN') markFreshSignIn();
      if (active) setSession(next);
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('getSession failed:', error.message);
        setSession(data.session ?? null);
      })
      .catch((err: unknown) => console.error('getSession failed:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('signOut failed:', error.message);
    } catch (err) {
      console.error('signOut failed:', err);
    } finally {
      clearLastActivity();
      setSession(null);
    }
  }, []);

  const value = useMemo(() => ({ session, loading, signOut }), [session, loading, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
