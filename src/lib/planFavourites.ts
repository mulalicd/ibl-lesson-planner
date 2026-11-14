/**
 * lib/planFavourites.ts — P5-2 and P5-1b (Director: "P5 odobren", DL-P27).
 *
 * Favourites are PER TEACHER: one row per (teacher, plan) in `plan_favorites`. Row Level Security lets a
 * teacher see, add and remove only their own rows, so a star never changes a colleague's view.
 * The old shared column `plans.is_favourite` is no longer read or changed by the app (kept in the database;
 * new plans still store its default, false).
 *
 * Author names come from `plan_authors(ids)`: the part of the author's e-mail before "@".
 */
import { supabase } from '@/integrations/supabase/client';
import type { ChangeResult } from '@/lib/planActions';

/** The signed-in teacher's favourite plan ids. On any failure: an empty set (never someone else's stars). */
export async function fetchFavouriteIds(): Promise<Set<string>> {
  try {
    const { data, error } = await supabase.from('plan_favorites').select('plan_id');
    if (error) {
      console.error('favourites fetch failed:', error.message);
      return new Set();
    }
    return new Set((data ?? []).map((r) => r.plan_id));
  } catch (e) {
    console.error('favourites fetch failed:', e);
    return new Set();
  }
}

/** Is this plan one of the signed-in teacher's favourites? */
export async function isFavourite(planId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('plan_favorites').select('plan_id').eq('plan_id', planId).limit(1);
    return !error && !!data && data.length > 0;
  } catch {
    return false;
  }
}

/** Adds or removes the star for the signed-in teacher. Any teacher may star any plan they can read. */
export async function setFavourite(planId: string, value: boolean): Promise<ChangeResult> {
  try {
    if (value) {
      // user_id is set by the database (DEFAULT auth.uid()); never sent by the client (E-4)
      const { error } = await supabase.from('plan_favorites').insert({ plan_id: planId });
      // 23505 = already a favourite (e.g. a second tab): the wanted state is reached
      if (error && error.code !== '23505') {
        console.error('favourite add failed:', error.message);
        return 'error';
      }
      return 'ok';
    }
    const { error } = await supabase.from('plan_favorites').delete().eq('plan_id', planId);
    if (error) {
      console.error('favourite remove failed:', error.message);
      return 'error';
    }
    return 'ok';
  } catch (e) {
    console.error('favourite change failed:', e);
    return 'error';
  }
}

/** Author name per plan id. Plans without a known author are missing from the map. */
export async function fetchPlanAuthors(planIds: string[]): Promise<Map<string, string>> {
  if (planIds.length === 0) return new Map();
  try {
    const { data, error } = await supabase.rpc('plan_authors', { p_plan_ids: planIds });
    if (error) {
      console.error('plan authors fetch failed:', error.message);
      return new Map();
    }
    return new Map((data ?? []).map((r) => [r.plan_id, r.author]));
  } catch (e) {
    console.error('plan authors fetch failed:', e);
    return new Map();
  }
}
