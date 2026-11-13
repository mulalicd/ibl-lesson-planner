import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PSI_VERSION_LABEL } from '@/lib/constants';

// The UI label must name the PSI that production actually uses (it showed "PSI v8.0" while v9.0 and then
// v9.1 were live — found by the Director 2026-11-13).
describe('PSI version label', () => {
  it('matches PRODUCTION_PSI in the Edge Function', () => {
    const src = readFileSync('supabase/functions/_shared/prompt.ts', 'utf8');
    const live = src.match(/export const PRODUCTION_PSI: ProductionPsi = "v(\d)(\d)";/);
    expect(live).not.toBeNull();
    expect(PSI_VERSION_LABEL).toBe(`PSI v${live![1]}.${live![2]}`);
  });
});
