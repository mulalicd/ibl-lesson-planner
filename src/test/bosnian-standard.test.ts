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
