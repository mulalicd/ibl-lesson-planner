import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contentSignature, structurePlan, type PlanBlock } from '@/lib/planDocxStructure';

const root = resolve(__dirname, '../..');
const V81 = readFileSync(resolve(root, 'supabase/functions/_shared/fixtures/plan_v81_fotosinteza_bs.txt'), 'utf8');
const flat = (b: PlanBlock[]) => b.map((x) => (x.type === 'table' ? x.rows.flat().join(' ') : 'text' in x ? x.text : '')).join(' ');

const V91 = `PLANER ZA IBL ČAS  (Inquiry-Based Learning)
TOK ČASA
| Min   | Faza          | Oblik rada  | Učenici rade        | Nastavnik radi | Produkt / dokaz       |
|-------|---------------|-------------|---------------------|----------------|-----------------------|
| 0-5   | Udica         | Frontalno   | posmatraju biljku   | pita           | pitanja               |
| 35-45 | Refleksija    | Individu-   | provjeravaju        | sluša          | listić — dokaz za I3  |
|       |               | alno        | "Mogu …"            |                |                       |
|       |               |             |                     | Ukupno:        | 45 min                |
REFLEKSIJA UČENIKA (pitanja za učenike)
|  Ko predstavlja: jedan po grupi   Kome: razredu   |
|  BILJKA   |--- Ugljen-dioksid   |`;

describe('P5-3 structured Word export (DL-P27)', () => {
  it('keeps every character of a real plan (nothing is lost on the way to Word)', () => {
    // same characters, same counts (joining wrapped cells may change their order, never drop one)
    const chars = (t: string) => [...contentSignature(t).replace(/·/g, '')].sort().join('');
    expect(chars(flat(structurePlan(V81)))).toBe(chars(V81));
    expect(chars(flat(structurePlan(V91)))).toBe(chars(V91));
  });
  it('turns the lesson-flow table into a real table; wrapped cells are joined; the total is its own row', () => {
    const t = structurePlan(V91).find((b) => b.type === 'table');
    expect(t?.type).toBe('table');
    const rows = (t as { rows: string[][] }).rows;
    expect(rows[0][0]).toBe('Min');
    expect(rows[2][2]).toBe('Individualno');
    expect(rows[3][4]).toBe('Ukupno:');
    expect(rows).toHaveLength(4);
  });
  it('recognises headings, also with a lowercase remark in brackets', () => {
    const heads = structurePlan(V91).filter((b) => b.type === 'heading').map((b) => ('text' in b ? b.text : ''));
    // section headings are written with single spaces (Director 2026-11-14)
    expect(heads).toEqual(['PLANER ZA IBL ČAS (Inquiry-Based Learning)', 'TOK ČASA', 'REFLEKSIJA UČENIKA (pitanja za učenike)']);
  });
  it('label/value lines become one readable line; a one-line "table" stays a drawing', () => {
    const b = structurePlan(V91);
    expect(b.some((x) => x.type === 'para' && x.text === 'Ko predstavlja: jedan po grupi  ·  Kome: razredu')).toBe(true);
    expect(b.some((x) => x.type === 'mono' && x.text.includes('BILJKA'))).toBe(true);
  });
});

describe('P5-3 label/value spacing', () => {
  it('no separator right after a colon ("School: · …" seen in the render)', () => {
    const b = structurePlan('School:       Internationale Deutsche Schule\nSubject:      Biologie        Grade:      5. razred');
    const texts = b.filter((x) => x.type === 'para').map((x) => ('text' in x ? x.text : ''));
    expect(texts).toEqual(['School: Internationale Deutsche Schule', 'Subject: Biologie  ·  Grade: 5. razred']);
  });
});

describe('space-aligned tables (Director 2026-11-14: an AI rubric showed as "a · b · c")', () => {
  const RUBRIC = [
    'KRITERIJ                 4 - Iznad očekivanja         3 - Ispunjeno očekivanje     2 - Djelimično ispunjeno',
    '1. Upotreba dokaza i     Sintetizuje dokaze iz        Koristi dokaze iz teksta     Navodi neke dokaze, ali',
    '   istraživanja          teksta i tabele.             i tabele.                    ih ne povezuje.',
    '2. Dubina rezonovanja    Analizira složenu            Objašnjava uticaj gena       Prepoznaje uticaj oba',
    '                         interakciju.                 i okoline.                   faktora.',
  ].join('\n');

  it('becomes a real table with wrapped cells joined', () => {
    const t = structurePlan(RUBRIC).find((b) => b.type === 'table');
    expect(t && 'rows' in t ? t.rows : null).toEqual([
      ['KRITERIJ', '4 - Iznad očekivanja', '3 - Ispunjeno očekivanje', '2 - Djelimično ispunjeno'],
      ['1. Upotreba dokaza i istraživanja', 'Sintetizuje dokaze iz teksta i tabele.', 'Koristi dokaze iz teksta i tabele.', 'Navodi neke dokaze, ali ih ne povezuje.'],
      ['2. Dubina rezonovanja', 'Analizira složenu interakciju.', 'Objašnjava uticaj gena i okoline.', 'Prepoznaje uticaj oba faktora.'],
    ]);
  });

  it('a plan section heading with minutes is a heading', () => {
    const b = structurePlan('UDICA                                   5 minuta\nTekst.');
    expect(b[0]).toEqual({ type: 'heading', text: 'UDICA 5 minuta' });
  });
});

describe('tables with "|" only between columns (Director 2026-11-14: amendment rubric in Word)', () => {
  const RUBRIC = [
    'KRITERIJ           | NIVO 4: PREMAŠUJE   | NIVO 3: ZADOVOLJAVA | NIVO 2: U RAZVOJU   | NIVO 1: POČETNI',
    '                   | OČEKIVANJA (4)      | OČEKIVANJA (3)      | (2)                 | NIVO (1)',
    '-------------------|---------------------|---------------------|---------------------|-------------------',
    '1. Korištenje      | Precizno koristi    | Navodi odgovarajuće | Navodi samo jedan   | Ne koristi dokaze',
    'dokaza i naučnih   | dokaze iz teksta i  | dokaze iz teksta za | vid dokaza.         | iz teksta.',
    '-------------------|---------------------|---------------------|---------------------|-------------------',
    '4. Jasnoća         | Izražava misli sa-  | Izražava misli      | Stav je uočen.      | Misli su nejasne.',
    'komunikacije       | držajno.            | jasno.              |                     |',
    '',
    'UPLIV U FORMIRANJE OCJENE:',
    '- 5-7 bodova   = Dovoljan (2)',
  ].join('\n');

  it('becomes one real table: header and rows joined, no dashes, no "·"', () => {
    const b = structurePlan(RUBRIC);
    const t = b.find((x) => x.type === 'table');
    expect(t && 'rows' in t ? t.rows : null).toEqual([
      ['KRITERIJ', 'NIVO 4: PREMAŠUJE OČEKIVANJA (4)', 'NIVO 3: ZADOVOLJAVA OČEKIVANJA (3)', 'NIVO 2: U RAZVOJU (2)', 'NIVO 1: POČETNI NIVO (1)'],
      ['1. Korištenje dokaza i naučnih', 'Precizno koristi dokaze iz teksta i', 'Navodi odgovarajuće dokaze iz teksta za', 'Navodi samo jedan vid dokaza.', 'Ne koristi dokaze iz teksta.'],
      ['4. Jasnoća komunikacije', 'Izražava misli sadržajno.', 'Izražava misli jasno.', 'Stav je uočen.', 'Misli su nejasne.'],
    ]);
    const text = b.map((x) => ('text' in x ? x.text : '')).join('\n');
    expect(text).not.toMatch(/-{3,}|·/);
    expect(b.some((x) => x.type === 'mono')).toBe(false);
    expect(b.some((x) => x.type === 'para' && x.text === '- 5-7 bodova = Dovoljan (2)')).toBe(true);
  });

  it('a single "a | b | c" line (a group subtitle) stays text', () => {
    const b = structurePlan('Biologie | 9. razred | Tema: geni | 45 min | Mikro čas\n================');
    expect(b.some((x) => x.type === 'table')).toBe(false);
  });
});
