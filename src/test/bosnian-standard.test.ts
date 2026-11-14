import { describe, expect, it } from 'vitest';
import { findNonStandardBosnian, hasCyrillic, normalizeBosnian } from '@/lib/language/bosnianStandard';
import { buildRepairMessage } from '@/lib/qualityChecks';

describe('DL-P19 Bosnian standard layer', () => {
  it('fixes grammar-safe Serbisms/ekavian forms and keeps the case', () => {
    expect(normalizeBosnian('Tačno je. Točno je. TOČNO. Deca uče gde je reka.'))
      .toBe('Tačno je. Tačno je. TAČNO. Djeca uče gdje je rijeka.');
    expect(normalizeBosnian('istorija, istorijski, opština, uopšte, hleba, primeri'))
      .toBe('historija, historijski, općina, uopće, hljeba, primjeri');
  });
  it('never touches correct Bosnian words or English terms', () => {
    const ok = 'točak, točkovi, decembar, vlakno, kolovoz, siječe, Pre-op, PRE-OUTPUT, vremena, mjesto';
    expect(normalizeBosnian(ok)).toBe(ok);
    expect(findNonStandardBosnian(ok)).toEqual([]);
  });
  it('is idempotent', () => {
    const once = normalizeBosnian('deca i vreme');
    expect(normalizeBosnian(once)).toBe(once);
  });
  it('flags Croatisms that need a rewrite (Director example: rajčica)', () => {
    const hits = findNonStandardBosnian('Donesite rajčice. Ovaj tjedan u kazalištu, u siječnju.').map((h) => h.found);
    expect(hits).toEqual(['rajčice', 'tjedan', 'kazalištu', 'siječnju']);
  });
  it('detects Cyrillic', () => {
    expect(hasCyrillic('Ученици')).toBe(true);
    expect(hasCyrillic('Učenici')).toBe(false);
  });
  it('"Popravi" names the exact words to replace', () => {
    const msg = buildRepairMessage(['bosnian_standard'], [{ id: 'bosnian_standard', detail: 'rajčice → paradajz' }]);
    expect(msg).toContain('- Bosanski jezik: rajčice → paradajz');
  });
});

describe('DL-P22: PSI A17 and the code name the same forbidden words', () => {
  it('every "Never" word in A17 is fixed or flagged by the language layer', async () => {
    const { readFileSync } = await import('node:fs');
    const psi = readFileSync('IDSS_IBL_PSI_v9_1.md', 'utf8');
    const block = psi.slice(psi.indexOf('A17 — LANGUAGE OF THE OUTPUT'), psi.indexOf('A15 — FIXED ORDER'));
    const never = block.slice(block.indexOf('Never:') + 6, block.indexOf('- german:'))
      .replace(/ekavian forms|\(|\)|…/g, ' ')
      .split(/[\s,]+/).map((w) => w.trim()).filter((w) => /^\p{L}+$/u.test(w));
    expect(never.length).toBeGreaterThan(20);
    for (const w of never) {
      const caught = normalizeBosnian(w) !== w || findNonStandardBosnian(w).length > 0;
      expect(caught, `A17 forbids "${w}" but the language layer does not catch it`).toBe(true);
    }
  });
});

describe('Director 2026-11-13: "Generiši", not "Generiraj"', () => {
  it('flags the Croatian -irati form of generisati', () => {
    expect(findNonStandardBosnian('Generiraj rubriku').map((h) => h.found)).toEqual(['Generiraj']);
    expect(findNonStandardBosnian('Generiši rubriku. Generisanje u toku.')).toEqual([]);
  });
});

describe('P5-5: stored plans are shown and exported with the language fixes', () => {
  it('fixes old Bosnian plans, leaves German/English untouched', async () => {
    const { displayPlanText } = await import('@/lib/language/bosnianStandard');
    expect(displayPlanText('Deca rade tačno, točno.', 'bosnian')).toBe('Djeca rade tačno, tačno.');
    expect(displayPlanText('Die Deca-Gruppe', 'german')).toBe('Die Deca-Gruppe');
    expect(displayPlanText('deca', null)).toBe('deca');
  });
});
