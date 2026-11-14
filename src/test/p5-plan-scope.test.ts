import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAN_SCOPE, PLAN_SCOPE_LABELS, planScopeQuery, planScopeTitle } from '@/lib/planScope';

describe('P5-1 library scope "Moji / Svi" (Director 2026-11-14)', () => {
  it('opens on the teacher\'s own plans', () => {
    expect(DEFAULT_PLAN_SCOPE).toBe('mine');
    expect(PLAN_SCOPE_LABELS).toEqual({ mine: 'Moji', all: 'Svi' });
  });
  it('"Moji" filters by owner, "Svi" does not', () => {
    expect(planScopeQuery('mine', 'u1')).toEqual({ kind: 'owner', ownerId: 'u1' });
    expect(planScopeQuery('all', 'u1')).toEqual({ kind: 'all' });
  });
  it('"Moji" without a user loads nothing — it never widens to all plans', () => {
    expect(planScopeQuery('mine', null)).toEqual({ kind: 'none' });
  });
  it('the title follows the scope', () => {
    expect(planScopeTitle('mine')).toBe('Moji IBL planovi');
    expect(planScopeTitle('all')).toBe('Svi IBL planovi');
  });
});
