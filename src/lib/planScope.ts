// P5-1 (Director 2026-11-14: "P5 odobren", default "Moji"). Since DL-P09 every signed-in teacher reads all
// plans; the library shows the teacher's own plans by default and all plans on request.

export type PlanScope = 'mine' | 'all';

/** Director's choice: the library opens on the teacher's own plans. */
export const DEFAULT_PLAN_SCOPE: PlanScope = 'mine';

export const PLAN_SCOPE_LABELS: Record<PlanScope, string> = { mine: 'Moji', all: 'Svi' };

/** Page title for the chosen scope. */
export function planScopeTitle(scope: PlanScope): string {
  return scope === 'mine' ? 'Moji IBL planovi' : 'Svi IBL planovi';
}

/** Which rows to load: the owner filter for "Moji", none for "Svi". Without a user id "Moji" loads nothing
 *  (never silently widens to all plans). */
export type PlanScopeQuery = { kind: 'owner'; ownerId: string } | { kind: 'all' } | { kind: 'none' };
export function planScopeQuery(scope: PlanScope, userId: string | null | undefined): PlanScopeQuery {
  if (scope === 'all') return { kind: 'all' };
  return userId ? { kind: 'owner', ownerId: userId } : { kind: 'none' };
}
