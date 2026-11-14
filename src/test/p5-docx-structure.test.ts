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
    expect(heads).toEqual(['PLANER ZA IBL ČAS  (Inquiry-Based Learning)', 'TOK ČASA', 'REFLEKSIJA UČENIKA (pitanja za učenike)']);
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
