import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const db = vi.hoisted(() => ({ result: { data: [] as { id: string }[] | null, error: null as null | { message: string } } }));
vi.mock('@/integrations/supabase/client', () => {
  const chain = { update: () => chain, eq: () => chain, select: async () => db.result };
  return { supabase: { from: () => chain, rpc: async () => ({ data: true, error: null }) } };
});

import { softDeletePlan, setPlanFavourite, canChangePlan } from '@/lib/planActions';
import { isPlanText } from '@/lib/planMeta';
import { ERROR_MESSAGES } from '@/lib/constants';

const FIXTURE = readFileSync(resolve(__dirname, '../../supabase/functions/_shared/fixtures/plan_v81_fotosinteza_bs.txt'), 'utf8');

describe('P2-2 plan changes report what the database really did (audit D-9)', () => {
  beforeEach(() => { db.result = { data: [], error: null }; });
  it('RLS refusal (0 rows, no error) is "forbidden", never "ok"', async () => {
    db.result = { data: [], error: null };
    expect(await softDeletePlan('p1')).toBe('forbidden');
    expect(await setPlanFavourite('p1', true)).toBe('forbidden');
  });
  it('a changed row is "ok"', async () => {
    db.result = { data: [{ id: 'p1' }], error: null };
    expect(await softDeletePlan('p1')).toBe('ok');
  });
  it('a database error is "error"', async () => {
    db.result = { data: null, error: { message: 'boom' } };
    expect(await softDeletePlan('p1')).toBe('error');
  });
  it('only the author or the admin may change a plan (UI rule mirrors RLS)', () => {
    expect(canChangePlan('u1', 'u1', false)).toBe(true);
    expect(canChangePlan('u1', 'u2', false)).toBe(false);
    expect(canChangePlan('u1', 'u2', true)).toBe(true);
    expect(canChangePlan(null, 'u2', false)).toBe(false);
    expect(canChangePlan('u1', undefined, false)).toBe(false);
  });
  it('the refusal message is the Director-approved wording (DL-P15)', () => {
    expect(ERROR_MESSAGES.DELETE_FORBIDDEN).toBe('Ovaj plan može obrisati samo njegov autor ili administrator.');
  });
});

describe('P2-3 plan detection (audit D-7)', () => {
  it('recognises a PSI v9 plan and the old v8.1 plan', () => {
    expect(isPlanText('====\nPLANER ZA IBL LEKCIJU  (Inquiry-Based Learning)\n====\nISTRAŽIVAČKO PITANJE\nZašto?')).toBe(true);
    expect(isPlanText('Evo ispravljenog plana:\n\n====\nIBL-UNTERRICHTSPLANER\nFORSCHUNGSFRAGE\nWarum?')).toBe(true);
    expect(isPlanText(FIXTURE)).toBe(true);
  });
  it('a chat answer that only quotes the heading is NOT a new plan', () => {
    const answer = 'Dobro pitanje! Vaše ISTRAŽIVAČKO PITANJE je otvoreno jer dopušta više odgovora.\n'.repeat(3);
    expect(isPlanText(answer)).toBe(false);
  });
});
