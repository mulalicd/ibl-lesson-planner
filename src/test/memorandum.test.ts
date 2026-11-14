import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { buildPlanOnMemorandum } from '@/lib/memorandumDocx';

const root = resolve(__dirname, '../..');
const TEMPLATE = readFileSync(resolve(root, 'src/assets/memorandum/IDSS_memorandum_nastavnici.docx'));
const ORIGINAL = readFileSync(resolve(root, 'templates/MEMORANDUM_IDSS_OD_20042026_NASTAVNICI.dotx'));
const PLAN = readFileSync(resolve(root, 'supabase/functions/_shared/fixtures/plan_v81_fotosinteza_bs.txt'), 'utf8');

describe('lesson plan on the official IDSS memorandum (Director 2026-11-10)', () => {
  it('keeps every header, footer and image of the official memorandum byte-for-byte', async () => {
    const out = await JSZip.loadAsync(await buildPlanOnMemorandum(TEMPLATE, PLAN));
    const orig = await JSZip.loadAsync(ORIGINAL);
    for (const part of ['word/header1.xml', 'word/header2.xml', 'word/header3.xml', 'word/footer1.xml', 'word/media/image1.png', 'word/media/image2.png']) {
      const a = await orig.file(part)!.async('uint8array');
      const b = await out.file(part)?.async('uint8array');
      expect(b, part).toBeDefined();
      expect(Buffer.from(b!).equals(Buffer.from(a)), part).toBe(true);
    }
  });

  it('is a Word DOCUMENT (not a template) whose body holds the plan, and keeps the memorandum page setup', async () => {
    const out = await JSZip.loadAsync(await buildPlanOnMemorandum(TEMPLATE, PLAN));
    const ct = await out.file('[Content_Types].xml')!.async('string');
    expect(ct).toContain('wordprocessingml.document.main+xml');
    expect(ct).not.toContain('wordprocessingml.template.main+xml');
    const doc = await out.file('word/document.xml')!.async('string');
    expect(doc).not.toContain('{{plan}}');
    expect(doc).toContain('Pisana priprema nastavnog časa');
    expect(doc).toContain('Fotosinteza');
    expect(doc).toContain('SECTION 10'); // the last section of this plan: nothing is cut off
    expect(doc).toMatch(/<w:headerReference w:type="default" r:id="rId9"\/>/);
    expect(doc).toContain('<w:pgSz w:w="11900" w:h="16838"/>');
    expect(doc).toMatch(/<w:pgMar w:top="1418" w:right="703" w:bottom="851" w:left="862" w:header="567" w:footer="289"/); // only the top margin differs
  });

  it('removes personal metadata from the template', async () => {
    const out = await JSZip.loadAsync(TEMPLATE);
    const core = await out.file('docProps/core.xml')!.async('string');
    expect(core).not.toMatch(/Davor|Mulali/);
  });
});

describe('conversation export on the memorandum (Director 2026-11-14)', () => {
  it('keeps the memorandum headers and writes the conversation like the plan, IDSS colours only', async () => {
    const { buildConversationOnMemorandum } = await import('@/lib/memorandumDocx');
    const entries = [
      { role: 'user', content: 'Predloži konkretan video za dokazni materijal', timestamp: '2026-11-14T14:56:00Z' },
      { role: 'model', content: 'PRIJEDLOG VIDEO DOKAZNOG MATERIJALA\n\n| Kriterij | Opis |\n|---|---|\n| Trajanje | 3 min |\n', timestamp: '2026-11-14T14:56:30Z' },
    ];
    const out = await JSZip.loadAsync(await buildConversationOnMemorandum(TEMPLATE, entries, 'Geni i okolina'));
    const orig = await JSZip.loadAsync(ORIGINAL);
    for (const part of ['word/header1.xml', 'word/footer1.xml', 'word/media/image1.png']) {
      const a = await orig.file(part)!.async('uint8array');
      const b = await out.file(part)?.async('uint8array');
      expect(Buffer.from(b!).equals(Buffer.from(a)), part).toBe(true);
    }
    const doc = await out.file('word/document.xml')!.async('string');
    expect(doc).toContain('Zapis razgovora s AI asistentom');
    expect(doc).toContain('Pisana priprema: Geni i okolina');
    expect(doc).toContain('Nastavnik');
    expect(doc).toContain('AI asistent');
    expect(doc).toContain('<w:tbl>'); // the AI answer's table is a real table
    expect(doc).not.toMatch(/6C63FF|4CAF93/i);
  });
});
