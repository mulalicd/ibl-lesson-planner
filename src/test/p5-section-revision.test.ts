import { describe, it, expect } from 'vitest';
import { cleanTitle, extractRevisedSection, findSectionRange, replaceSection, buildRevisionRequest } from '@/lib/sectionRevision';

const PLAN = [
  'PLANER ZA IBL ČAS',
  '================================================================================',
  'UDICA',
  '================================================================================',
  '| Stara udica, red 1 |',
  '| Stara udica, red 2 |',
  '',
  '================================================================================',
  'ISTRAŽIVAČKO PITANJE (IQ)',
  '================================================================================',
  '| Zašto? |',
].join('\n');

describe('P5-4 one section is replaced, nothing else changes', () => {
  it('finds the section between its heading and the next box', () => {
    const r = findSectionRange(PLAN, { title: 'UDICA', nextTitle: 'ISTRAŽIVAČKO PITANJE (IQ)', occurrence: 0 });
    expect(r).toEqual({ start: 2, end: 7 });
  });

  it('replaces only that section; every other line is identical', () => {
    const out = replaceSection(PLAN, { title: 'UDICA', nextTitle: 'ISTRAŽIVAČKO PITANJE (IQ)', occurrence: 0 },
      'UDICA\n================================================================================\n| Nova udica |')!;
    expect(out).toContain('| Nova udica |');
    expect(out).not.toContain('Stara udica');
    const before = PLAN.split('\n'); const after = out.split('\n');
    expect(after.slice(0, 2)).toEqual(before.slice(0, 2));
    expect(after.slice(-5)).toEqual(before.slice(-5));
  });

  it('keeps only the section from the AI answer (no intro, no closing box)', () => {
    const answer = 'Evo prepravljenog dijela:\n\nUDICA\n====\n| Nova udica |\n====\n\n';
    expect(extractRevisedSection(answer, 'UDICA')).toBe('UDICA\n====\n| Nova udica |');
    expect(extractRevisedSection('Ne mogu.', 'UDICA')).toBeNull();
    expect(extractRevisedSection('UDICA', 'UDICA')).toBeNull();
  });

  it('a section that cannot be found leaves the plan unchanged (null)', () => {
    expect(replaceSection(PLAN, { title: 'NEMA', nextTitle: null, occurrence: 0 }, 'X\nY')).toBeNull();
  });

  it('the last section runs to the end of the plan', () => {
    const out = replaceSection(PLAN, { title: 'ISTRAŽIVAČKO PITANJE (IQ)', nextTitle: null, occurrence: 0 }, 'ISTRAŽIVAČKO PITANJE (IQ)\n| Kako? |')!;
    expect(out.endsWith('| Kako? |')).toBe(true);
    expect(out).toContain('Stara udica, red 1');
  });

  it('the AI instruction names the section, the language and "only this section"', () => {
    const t = buildRevisionRequest('UDICA', 'kraće', 'german');
    expect(t).toContain('"UDICA"');
    expect(t).toContain('German (Deutsch)');
    expect(t).toContain('"kraće"');
    expect(t).toMatch(/Output ONLY the complete revised section/);
  });
  it('bug 2026-11-14: an answer that brings the following sections is cut at the first other heading (no duplicates)', () => {
    const plan = 'DODATNI RESURSI ZA NASTAVNIKE\n====\n\nDIFERENCIJACIJA\n| stara |\n\nKLJUČNI POJMOVI\n| pojmovi |';
    const ref = { title: 'DIFERENCIJACIJA', nextTitle: 'KLJUČNI POJMOVI', occurrence: 0, stopTitles: ['DODATNI RESURSI ZA NASTAVNIKE', 'KLJUČNI POJMOVI'] };
    const answer = 'DIFERENCIJACIJA\n| nova |\n\nKLJUČNI POJMOVI\n| novi pojmovi |';
    const revised = extractRevisedSection(answer, ref.title, ref.stopTitles)!;
    expect(revised).toBe('DIFERENCIJACIJA\n| nova |');
    const out = replaceSection(plan, ref, revised)!;
    expect(out.match(/KLJUČNI POJMOVI/g)).toHaveLength(1);
    expect(out).toContain('| pojmovi |');
    expect(out).not.toContain('novi pojmovi');
  });

  it('bug 2026-11-14: a heading with only other sections under it is not a revision (reported as failed)', () => {
    const answer = 'DODATNI RESURSI ZA NASTAVNIKE\n====\n\nDIFERENCIJACIJA\n| nova |';
    expect(extractRevisedSection(answer, 'DODATNI RESURSI ZA NASTAVNIKE', ['DIFERENCIJACIJA'])).toBeNull();
  });
});
