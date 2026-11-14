import { describe, it, expect, vi, beforeEach } from 'vitest';

// P5-2 / P5-1b: favourites are the teacher's own rows; authors come from plan_authors.
const db = vi.hoisted(() => ({
  calls: [] as string[],
  result: { data: null as unknown, error: null as null | { message: string; code?: string } },
}));
vi.mock('@/integrations/supabase/client', () => {
  const chain = {
    select: (..._a: unknown[]) => { db.calls.push('select'); return chain; },
    insert: (row: unknown) => { db.calls.push(`insert ${JSON.stringify(row)}`); return chain; },
    delete: () => { db.calls.push('delete'); return chain; },
    eq: (c: string, v: string) => { db.calls.push(`eq ${c}=${v}`); return chain; },
    limit: () => chain,
    then: (ok: (r: unknown) => unknown) => Promise.resolve(db.result).then(ok),
  };
  return {
    supabase: {
      from: (t: string) => { db.calls.push(`from ${t}`); return chain; },
      rpc: async (fn: string, args: unknown) => { db.calls.push(`rpc ${fn} ${JSON.stringify(args)}`); return db.result; },
    },
  };
});

import { fetchFavouriteIds, setFavourite, isFavourite, fetchPlanAuthors } from '@/lib/planFavourites';

describe('P5-2 own favourites', () => {
  beforeEach(() => { db.calls = []; db.result = { data: [], error: null }; });

  it('reads plan_favorites (RLS returns only own rows), never plans.is_favourite', async () => {
    db.result = { data: [{ plan_id: 'a' }, { plan_id: 'b' }], error: null };
    const ids = await fetchFavouriteIds();
    expect([...ids]).toEqual(['a', 'b']);
    expect(db.calls[0]).toBe('from plan_favorites');
  });

  it('a read failure gives no stars, not an error screen', async () => {
    db.result = { data: null, error: { message: 'boom' } };
    expect((await fetchFavouriteIds()).size).toBe(0);
  });

  it('adding a star sends only the plan id (user_id is set by the database, E-4)', async () => {
    expect(await setFavourite('p1', true)).toBe('ok');
    expect(db.calls).toContain('insert {"plan_id":"p1"}');
  });

  it('a star that already exists counts as done', async () => {
    db.result = { data: null, error: { message: 'duplicate', code: '23505' } };
    expect(await setFavourite('p1', true)).toBe('ok');
  });

  it('removing a star deletes the own row of that plan', async () => {
    expect(await setFavourite('p1', false)).toBe('ok');
    expect(db.calls).toEqual(['from plan_favorites', 'delete', 'eq plan_id=p1']);
  });

  it('a database error is reported, so the star is reset in the UI', async () => {
    db.result = { data: null, error: { message: 'boom' } };
    expect(await setFavourite('p1', false)).toBe('error');
  });

  it('isFavourite is true only when the own row exists', async () => {
    db.result = { data: [{ plan_id: 'p1' }], error: null };
    expect(await isFavourite('p1')).toBe(true);
    db.result = { data: [], error: null };
    expect(await isFavourite('p1')).toBe(false);
  });
});

describe('P5-1b author names', () => {
  beforeEach(() => { db.calls = []; db.result = { data: [], error: null }; });

  it('calls plan_authors with the ids and maps plan → name', async () => {
    db.result = { data: [{ plan_id: 'a', author: 'maja.ljubovic' }], error: null };
    const m = await fetchPlanAuthors(['a', 'b']);
    expect(db.calls).toEqual(['rpc plan_authors {"p_plan_ids":["a","b"]}']);
    expect(m.get('a')).toBe('maja.ljubovic');
    expect(m.has('b')).toBe(false);
  });

  it('no request for an empty page; an error gives no names', async () => {
    expect((await fetchPlanAuthors([])).size).toBe(0);
    expect(db.calls).toEqual([]);
    db.result = { data: null, error: { message: 'boom' } };
    expect((await fetchPlanAuthors(['a'])).size).toBe(0);
  });
});
