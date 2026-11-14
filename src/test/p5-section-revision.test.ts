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

// the database is never reached in this file: the gate refuses before any call
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => { throw new Error('database must not be called'); } } }));

describe('P6 completeness gate for changes to a saved plan (Director 2026-11-14: UDICA was lost)', () => {
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

  it('a plan without a section is never written over the saved plan', async () => {
    const { replacePlanText } = await import('@/lib/planConversations');
    expect(await replacePlanText('p', null, PLAN, withoutUdica)).toBe('error');
  });
});

describe('P6 amendments (Director 2026-11-14: "originalni plan ostaje intaktan … amandman 1, 2")', () => {
  const PLAN = readFileSync(resolve(__dirname, '../../supabase/functions/_shared/fixtures/plan_v91_fotosinteza_bs.txt'), 'utf8');
  const ANSWER = [
    'Razumijem. Generišem rubriku za ocjenjivanje "exit ticketa" kao dokaza učenja.',
    '',
    'Evo rubrike:',
    '',
    'RUBRIKA ZA OCJENJIVANJE DOKAZA UČENJA: EXIT TICKET',
    '',
    'KRITERIJ                 4 - Iznad očekivanja         3 - Ispunjeno očekivanje',
    '1. Upotreba dokaza       Sintetizuje dokaze.          Koristi dokaze.',
    '2. Dubina rezonovanja    Analizira interakciju.       Objašnjava uticaj.',
    '',
    'Moguća sljedeća pitanja:',
    '- "Kako mogu koristiti ovu rubriku za formativno ocjenjivanje?"',
  ].join('\n');

  it('keeps the answer word for word, without the intro and the follow-up questions', async () => {
    const { amendmentFromAnswer } = await import('@/lib/planAppendix');
    const a = amendmentFromAnswer(ANSWER, 'Generiši rubriku za ocjenjivanje dokaza učenja')!;
    expect(a.title).toBe('RUBRIKA ZA OCJENJIVANJE DOKAZA UČENJA: EXIT TICKET');
    expect(a.body).toContain('2. Dubina rezonovanja    Analizira interakciju.       Objašnjava uticaj.');
    expect(a.body).not.toContain('Razumijem');
    expect(a.body).not.toContain('Moguća sljedeća pitanja');
  });

  it('the original plan stays intact; amendments are numbered after it', async () => {
    const { amendmentFromAnswer, addAmendment } = await import('@/lib/planAppendix');
    const a = amendmentFromAnswer(ANSWER, 'x')!;
    const one = addAmendment(PLAN, a, 'bosnian');
    const two = addAmendment(one, { title: 'UDICA 5 minuta, nova verzija', body: 'Nova udica.' }, 'bosnian');
    const before = parseSegments(PLAN).map((s) => s.title);
    const after = parseSegments(two).map((s) => s.title);
    expect(after).toHaveLength(before.length + 2);
    expect(after[after.length - 3]).toBe('AMANDMAN 1 — RUBRIKA ZA OCJENJIVANJE DOKAZA UČENJA, EXIT TICKET');
    expect(after[after.length - 2]).toBe('AMANDMAN 2 — UDICA 5 minuta, nova verzija');
    expect(after[after.length - 1]).toMatch(/^ŠTA MOŽETE URADITI SLJEDEĆE/);
    // every line of the original plan is still there, in order
    const lines = two.split('\n');
    let at = -1;
    for (const l of PLAN.split('\n')) { const k = lines.indexOf(l, at + 1); expect(k, l).toBeGreaterThan(at); at = k; }
  });

  it('a German plan gets "ERGÄNZUNG"; without a title line the question names it', async () => {
    const { amendmentFromAnswer, addAmendment } = await import('@/lib/planAppendix');
    const a = amendmentFromAnswer('Pokažite kratki video od 3 minute.', 'Predloži konkretan video?')!;
    expect(a.title).toBe('PREDLOŽI KONKRETAN VIDEO');
    expect(addAmendment('PLAN\ntext', a, 'german')).toContain('ERGÄNZUNG 1 — PREDLOŽI KONKRETAN VIDEO');
    expect(amendmentFromAnswer('Moguća sljedeća pitanja:\n- x', 'q')).toBeNull();
  });
});
