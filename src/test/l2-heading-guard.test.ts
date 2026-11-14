import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fixHeadingTypos, correctHeading, findTripleLetters } from '@/lib/language/headingGuard';
import { displayPlanText } from '@/lib/language/bosnianStandard';
import { QUALITY_CHECK_LABELS, buildRepairMessage } from '@/lib/qualityChecks';

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');

// L-2 step 1 (DL-P32): misspelled fixed headings are corrected; three equal letters are flagged.
describe('DL-P32 heading guard', () => {
  it('the seen typo is corrected (eval run 43543883627: "TIPPPS & TRICKS")', () => {
    expect(fixHeadingTypos('TIPPPS & TRICKS FÜR LEHRKRÄFTE\nText\n', 'german')).toBe('TIPPS & TRICKS FÜR LEHRKRÄFTE\nText\n');
  });

  it('boxes and suffixes stay; only the heading part is corrected', () => {
    expect(fixHeadingTypos('|  SAVJETI I TRIKOVI ZA NASTAVNIKA  |\nKLJUČNI POJMVI — 5. razred\n', 'bosnian'))
      .toBe('|  SAVJETI I TRIKOVI ZA NASTAVNIKE  |\nKLJUČNI POJMOVI — 5. razred\n');
  });

  it('never "corrects" grammar, short words, mixed-case text or the line still streaming', () => {
    expect(correctHeading('IZAZOVI', 'bosnian')).toBeNull();
    expect(correctHeading('UDICA', 'bosnian')).toBeNull();
    expect(fixHeadingTypos('Savjeti i trikovi za nastavnika\n', 'bosnian')).toBe('Savjeti i trikovi za nastavnika\n');
    expect(fixHeadingTypos('Text\nSAVJETI I TRIKOVI ZA NASTAVNIK', 'bosnian')).toBe('Text\nSAVJETI I TRIKOVI ZA NASTAVNIK');
  });

  it('changes nothing in correct plans and in the PSI templates (no false corrections)', () => {
    const fixture = read('../../supabase/functions/_shared/fixtures/plan_v81_fotosinteza_bs.txt');
    expect(fixHeadingTypos(fixture, 'bosnian')).toBe(fixture);
    const psi = read('../../IDSS_IBL_PSI_v9_1.md');
    for (const lang of ['bosnian', 'german', 'english']) expect(fixHeadingTypos(psi, lang)).toBe(psi);
  });

  it('stored plans are shown with the same correction', () => {
    expect(displayPlanText('TIPPPS & TRICKS FÜR LEHRKRÄFTE\n', 'german')).toBe('TIPPS & TRICKS FÜR LEHRKRÄFTE\n');
  });
});

describe('DL-P32 three equal letters are flagged, never changed', () => {
  it('Bosnian and English words are flagged; web addresses and Roman numerals are not', () => {
    expect(findTripleLetters('Učeniccci rade. www.idss.ba III', 'bosnian')).toEqual(['Učeniccci']);
    expect(findTripleLetters('Studentsss', 'english')).toEqual(['Studentsss']);
  });
  it('German is left out ("Schifffahrt" is correct German)', () => {
    expect(findTripleLetters('Schifffahrt', 'german')).toEqual([]);
  });
  it('the badge label and the "Popravi" message name the words', () => {
    expect(QUALITY_CHECK_LABELS.spelling_suspect).toBe('Moguća greška u pisanju');
    expect(buildRepairMessage(['spelling_suspect'], [{ id: 'spelling_suspect', detail: 'Učeniccci' }])).toContain('Moguća greška u pisanju: Učeniccci');
  });
});
