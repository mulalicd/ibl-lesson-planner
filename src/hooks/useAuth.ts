/**
 * Sign-in state for the whole app (P1, DL-P05).
 * The role (teacher/admin) is NOT read here: authorisation is enforced by
 * the database (RLS + is_admin()) and the Edge Function (Commander E-4).
 */
import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

