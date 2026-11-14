/**
 * lib/planActions.ts — changes to a saved plan (P2-2, audit D-9).
 *
 * Row Level Security (P1, DL-P09) lets only the author or the admin change a
 * plan. When RLS refuses an UPDATE, Supabase returns NO error: it updates 0 rows.
 * So every change asks for the changed row back (`.select('id')`) and treats
 * "no row" as refused. The database stays the authority (E-4); the UI only reports.
 */
import { supabase } from '@/integrations/supabase/client';

export type ChangeResult = 'ok' | 'forbidden' | 'error';

async function updatePlan(planId: string, change: { is_deleted?: boolean; is_favourite?: boolean }): Promise<ChangeResult> {
  try {
    const { data, error } = await supabase.from('plans').update(change).eq('id', planId).select('id');
    if (error) {
      console.error('plan update failed:', error.message);
      return 'error';
    }
    return data && data.length > 0 ? 'ok' : 'forbidden';
  } catch (e) {
    console.error('plan update failed:', e);
    return 'error';
  }
}

export function softDeletePlan(planId: string): Promise<ChangeResult> {
  return updatePlan(planId, { is_deleted: true });
}

/** @deprecated P5-2: the shared star. Use setFavourite from lib/planFavourites (own favourites). */
export function setPlanFavourite(planId: string, value: boolean): Promise<ChangeResult> {
  return updatePlan(planId, { is_favourite: value });
}

/** UI convenience only (which buttons to show). The database enforces the rule. */
export async function fetchIsAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    return !error && data === true;
  } catch {
    return false;
  }
}

export function canChangePlan(ownerId: string | null | undefined, userId: string | undefined, isAdmin: boolean): boolean {
  return isAdmin || (!!userId && ownerId === userId);
}
