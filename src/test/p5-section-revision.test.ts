import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractRevisedSection, replaceSection, buildRevisionRequest, type SectionRef } from '@/lib/sectionRevision';
import { parseSegments } from '@/lib/planSegments';

const G08 = readFileSync(resolve(__dirname, '../../supabase/functions/_shared/fixtures/plan_v91_fotosinteza_bs.txt'), 'utf8');
const segs = parseSegments(G08);
const refOf = (head: string): SectionRef => {
  const index = segs.findIndex((s) => s.head === head);
  return { index, head, title: segs[index].title, stopHeads: segs.filter((_, k) => k !== index).map((s) => s.head) };
};

describe('P5-4 one segment is replaced, nothing else changes (P6 S2 segments, real plan g08)', () => {
  it('replaces only the chosen segment; every line before and after is identical', () => {
    const ref = refOf('UDICA');
    const out = replaceSection(G08, ref, 'UDICA                    5 minuta\n================\n| Nova udica s dvije biljke. |')!;
    expect(out).toContain('| Nova udica s dvije biljke. |');
    const before = G08.split('\n');
    const after = out.split('\n');
    const s = segs[ref.index];
    expect(after.slice(0, s.start)).toEqual(before.slice(0, s.start));
    expect(after.slice(after.length - (before.length - s.end))).toEqual(before.slice(s.end));
    expect(parseSegments(out).map((x) => x.head)).toEqual(segs.map((x) => x.head));
  });

  it('keeps only the segment from the AI answer (no intro, no closing box)', () => {
    const answer = 'Evo prepravljenog dijela:\n\nUDICA     5 minuta\n====\n| Nova udica |\n====\n\n';
    expect(extractRevisedSection(answer, 'UDICA')).toBe('UDICA     5 minuta\n====\n| Nova udica |');
    expect(extractRevisedSection('Ne mogu.', 'UDICA')).toBeNull();
    expect(extractRevisedSection('UDICA', 'UDICA')).toBeNull();
  });

  it('bug 2026-11-14: an answer that brings the following segments is cut at the first other heading (no duplicates)', () => {
    const ref = refOf('DIFERENCIJACIJA');
    const answer = 'DIFERENCIJACIJA\n| nova podrška |\n\nKLJUČNI POJMOVI — 5. razred\n| novi pojmovi |';
    const revised = extractRevisedSection(answer, ref.head, ref.stopHeads)!;
    expect(revised).toBe('DIFERENCIJACIJA\n| nova podrška |');
    const out = replaceSection(G08, ref, revised)!;
    expect(out.match(/KLJUČNI POJMOVI/g)).toHaveLength(G08.match(/KLJUČNI POJMOVI/g)!.length);
    expect(out).not.toContain('novi pojmovi');
  });

  it('bug 2026-11-14: a heading with only other segments under it is not a revision', () => {
    expect(extractRevisedSection('DODATNI RESURSI ZA NASTAVNIKE\n====\n\nDIFERENCIJACIJA\n| nova |', 'DODATNI RESURSI ZA NASTAVNIKE', ['DIFERENCIJACIJA'])).toBeNull();
  });

  it('a segment that moved is not replaced (null, the plan stays as it was)', () => {
    expect(replaceSection(G08, { ...refOf('UDICA'), head: 'NEŠTO DRUGO' }, 'X\nY')).toBeNull();
  });

  it('the AI instruction names the segment, the language and "only this section"', () => {
    const t = buildRevisionRequest('UDICA', 'kraće', 'german');
    expect(t).toContain('"UDICA"');
    expect(t).toContain('German (Deutsch)');
    expect(t).toContain('"kraće"');
    expect(t).toMatch(/Output ONLY the complete revised section/);
  });
});

describe('P6 "Ugradi u plan" (DL-P37)', () => {
  it('keeps only the complete plan from the AI answer, without an introduction', async () => {
    const { extractFullPlan } = await import('@/lib/sectionRevision');
    const { isPlanText } = await import('@/lib/planMeta');
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const plan = readFileSync(resolve(__dirname, '../../supabase/functions/_shared/fixtures/plan_v91_fotosinteza_bs.txt'), 'utf8');
    const out = extractFullPlan(`Evo plana s ugrađenim prijedlozima:\n\n${plan}`, isPlanText);
    expect(out).not.toBeNull();
    expect(out!.startsWith('Evo')).toBe(false);
    expect(out).toContain('UDICA');
    expect(extractFullPlan('Samo kratak odgovor bez plana.', isPlanText)).toBeNull();
  });

  it('asks for the whole plan in the plan language, with no follow-up questions', async () => {
    const { buildIncorporateRequest } = await import('@/lib/sectionRevision');
    const r = buildIncorporateRequest('bosnian');
    expect(r).toMatch(/COMPLETE lesson plan/);
    expect(r).toMatch(/no suggested follow-up questions/);
    expect(r).toMatch(/Bosnian/);
  });
});

// the database is never reached in this file: the gate refuses before any call
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => { throw new Error('database must not be called'); } } }));

describe('P6 "Ugradi u plan" completeness gate (Director 2026-11-14: UDICA was lost)', () => {
  const PLAN = readFileSync(resolve(__dirname, '../../supabase/functions/_shared/fixtures/plan_v91_fotosinteza_bs.txt'), 'utf8');
  const withoutUdica = (() => {
    const segs = parseSegments(PLAN);
    const u = segs.find((s) => s.head === 'UDICA')!;
    const lines = PLAN.split('\n');
    return [...lines.slice(0, u.start), ...lines.slice(u.end)].join('\n');
  })();

  it('names the section the AI left out', async () => {
    const { missingSections } = await import('@/lib/sectionRevision');
    expect(missingSections(PLAN, withoutUdica)).toEqual([expect.stringMatching(/^UDICA/)]);
    expect(missingSections(PLAN, PLAN)).toEqual([]);
  });

  it('a plan cut down to a fraction is refused', async () => {
    const { isMuchShorter } = await import('@/lib/sectionRevision');
    expect(isMuchShorter(PLAN, PLAN.slice(0, PLAN.length / 2))).toBe(true);
    expect(isMuchShorter(PLAN, PLAN)).toBe(false);
  });

  it('the instruction lists every section that must stay', async () => {
    const { buildIncorporateRequest } = await import('@/lib/sectionRevision');
    const titles = parseSegments(PLAN).map((s) => s.title);
    const r = buildIncorporateRequest('bosnian', titles);
    expect(r).toContain(`ALL ${titles.length} sections`);
    for (const t of titles) expect(r).toContain(`- ${t}`);
  });

  it('a plan without a section is never written over the saved plan', async () => {
    const { replacePlanText } = await import('@/lib/planConversations');
    expect(await replacePlanText('p', null, PLAN, withoutUdica)).toBe('error');
  });
});
