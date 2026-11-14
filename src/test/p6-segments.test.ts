import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseSegments, headingOf, audienceOf, replaceSegment } from '@/lib/planSegments';

const G08 = readFileSync(resolve(__dirname, '../../supabase/functions/_shared/fixtures/plan_v91_fotosinteza_bs.txt'), 'utf8');

describe('P6 S2 plan segments (real PSI v9.1 plan g08)', () => {
  const segs = parseSegments(G08);

  it('every line belongs to exactly one segment, in order (nothing lost, nothing changed)', () => {
    const lines = G08.replace(/\r/g, '').split('\n');
    expect(segs[0].start).toBe(0);
    expect(segs[segs.length - 1].end).toBe(lines.length);
    for (let k = 1; k < segs.length; k++) expect(segs[k].start).toBe(segs[k - 1].end);
  });

  it('finds the real segments with their names as written', () => {
    const heads = segs.map((s) => s.head);
    for (const h of ['UDICA', 'ISTRAŽIVAČKO PITANJE', 'ISHODI UČENJA', 'SKELA', 'DOKAZ UČENJA', 'DIFERENCIJACIJA', 'KLJUČNI POJMOVI', 'TOK ČASA', 'PREDSTAVLJANJE NALAZA', 'REFLEKSIJA UČENIKA', 'SAVJETI I TRIKOVI ZA NASTAVNIKE']) {
      expect(heads.some((x) => x.startsWith(h)), h).toBe(true);
    }
    expect(segs.find((s) => s.head === 'UDICA')?.minutes).toBe('5 minuta');
  });

  it('label lines are content, not segments', () => {
    expect(headingOf('ZPD NOTE: Nije navedeno prethodno znanje')).toBeNull();
    expect(headingOf('VIZUELNI ELEMENT 1: Šta ulazi i izlazi iz biljke?')).toBeNull();
    expect(headingOf('|  PODRŠKA — Učenici kojima je potrebna pomoć  |')).toBeNull();
    expect(headingOf('KLJUČNI POJMOVI — 5. razred')).toBe('KLJUČNI POJMOVI');
  });

  it('audience follows the approved map, also for German and English headings', () => {
    expect(audienceOf('UDICA')).toBe('u');
    expect(audienceOf('SKELA — VAŠA ULOGA')).toBe('n');
    expect(audienceOf('TOK ČASA')).toBe('nu');
    expect(audienceOf('EINSTIEG')).toBe('u');
    expect(audienceOf('LESSON FLOW')).toBe('nu');
    expect(audienceOf('NEPOZNATI NASLOV')).toBe('n');
  });

  it('replacing one segment changes only its lines', () => {
    const i = segs.findIndex((s) => s.head === 'UDICA');
    const out = replaceSegment(G08, i, 'UDICA\n| nova udica |');
    expect(out).toContain('| nova udica |');
    const before = G08.split('\n');
    const after = out.split('\n');
    expect(after.slice(0, segs[i].start)).toEqual(before.slice(0, segs[i].start));
    expect(after.slice(-(before.length - segs[i].end))).toEqual(before.slice(segs[i].end));
  });
});

// Director 2026-11-14: no Markdown/ASCII leftovers, no section that looks empty, a saved plan as one document
describe('P6 rendering quality', () => {
  it('a rule drawn inside a box ("|-----|") is never text', async () => {
    const { structurePlan } = await import('@/lib/planDocxStructure');
    const blocks = structurePlan('| CILJ: tekst |\n|------------------------------|\n| I1  Učenik može opisati. |');
    expect(blocks.some((b) => b.type === 'para' && /-{3,}/.test(b.text))).toBe(false);
    expect(blocks.some((b) => b.type === 'para' && b.text.startsWith('I1'))).toBe(true);
  });

  it('a group heading ("PREPORUKE ZA IZVOĐENJE ČASA" + one "a | b | c" line) is a label, not a page', async () => {
    const { isGroupHeading, groupSubtitle } = await import('@/lib/planSegments');
    const segs = parseSegments(G08);
    const g = segs.find((s) => s.head.startsWith('PREPORUKE ZA IZVO'));
    expect(g && isGroupHeading(g)).toBe(true);
    expect(g && groupSubtitle(g)).toMatch(/\| 45 min \|/);
    const udica = segs.find((s) => s.head === 'UDICA');
    expect(udica && isGroupHeading(udica)).toBe(false);
  });
});
