import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeTemplateLines } from '@/lib/language/templateLines';
import { TEMPLATE_LINES } from '@/lib/language/templateLines.generated';
import { displayPlanText, findNonStandardBosnian } from '@/lib/language/bosnianStandard';

// DL-P30: exact Bosnian template lines in a German/English plan → the German/English line of PSI Module 3.10.
describe('DL-P30 template-line layer (German and English plans)', () => {
  it('the seen leaks are replaced (eval runs 43540520949 and 43543883627)', () => {
    const leaked = '|  [X]  Set predmeta za posmatranje / Experimentierset |\n|  [ ]  Stare mape ili fotografije |';
    const de = normalizeTemplateLines(leaked, 'german');
    expect(de).toContain('Gegenstände zum Beobachten / Experimentierset');
    expect(de).toContain('Alte Karten oder Fotografien');
    expect(normalizeTemplateLines(leaked, 'english')).toContain('Old maps or photographs');
  });

  it('ALL-CAPS headings and single labels of the lesson-flow table are replaced', () => {
    expect(normalizeTemplateLines('SET PREDMETA ZA POSMATRANJE', 'german')).toBe('GEGENSTÄNDE ZUM BEOBACHTEN');
    // "Udica " (6) → "Hook  " keeps the cell width; a longer label uses one space before the |
    expect(normalizeTemplateLines('| 0-5 | Udica | Frontalno |', 'english')).toBe('| 0-5 | Hook  | Whole class |');
  });

  it('a table cell keeps its width, so the | stays in place', () => {
    const row = '| 0-5   | Udica           | Frontalno   | x |';
    const out = normalizeTemplateLines(row, 'german');
    expect(out).toBe('| 0-5   | Einstieg        | Plenum      | x |');
    expect(out.length).toBe(row.length);
  });

  it('Bosnian plans are never touched; the layer is idempotent', () => {
    const bs = 'Stare mape ili fotografije. Udica. Drugo.';
    expect(normalizeTemplateLines(bs, 'bosnian')).toBe(bs);
    const once = normalizeTemplateLines(bs, 'german');
    expect(normalizeTemplateLines(once, 'german')).toBe(once);
  });

  it('words inside other words are not touched (whole lines only)', () => {
    expect(normalizeTemplateLines('Drugostepeni', 'german')).toBe('Drugostepeni');
    expect(normalizeTemplateLines('Die Gruppe arbeitet.', 'german')).toBe('Die Gruppe arbeitet.');
  });

  it('stored plans get the same layer when shown (P5-5 parity)', () => {
    expect(displayPlanText('Stare mape ili fotografije', 'english')).toBe('Old maps or photographs');
  });

  it('the data is the PSI list itself (generated from Module 3.10, M-7)', () => {
    const psi = readFileSync(resolve(__dirname, '../../IDSS_IBL_PSI_v9_1.md'), 'utf8');
    expect(TEMPLATE_LINES.length).toBeGreaterThanOrEqual(40);
    for (const [bs, de, en] of TEMPLATE_LINES) expect(psi).toContain(`BS: ${bs}\n  DE: ${de}\n  EN: ${en}`);
  });
});

describe('DL-P30 "sustavan" (Croatian) is flagged in Bosnian plans', () => {
  it('flags sustav/sustavan with the standard words', () => {
    expect(findNonStandardBosnian('Odaberite jedan sustavan produkt.').map((h) => h.standard)).toEqual(['sistem / sistematičan']);
  });
  it('the Bosnian PSI template no longer contains it', () => {
    const psi = readFileSync(resolve(__dirname, '../../IDSS_IBL_PSI_v9_1.md'), 'utf8');
    expect(psi).not.toMatch(/sustav/i);
  });
});
