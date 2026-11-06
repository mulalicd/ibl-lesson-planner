/**
 * Auth helpers without React (P1). Kept out of component files so
 * Vite fast refresh keeps working.
 */
import { supabase } from '@/integrations/supabase/client';

/** Current access token for Edge Function calls, or null if signed out. */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('getSession failed:', error.message);
      return null;
    }
    return data.session?.access_token ?? null;
  } catch (err) {
    console.error('getSession failed:', err);
    return null;
  }
}

/** Dispatched by long-running work (AI streaming) so the idle timer does not fire mid-generation. */
export const ACTIVITY_EVENT = 'ibl-activity';
export function signalActivity(): void {
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
}
