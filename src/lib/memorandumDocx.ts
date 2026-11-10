/**
 * lib/memorandumDocx.ts — the lesson plan as a Word document ON the school's official
 * memorandum (Director, 2026-11-10: "ugradi ovaj memorandum u svaki plan nastavnog časa").
 *
 * The template (src/assets/memorandum/IDSS_memorandum_nastavnici.docx) is built from
 * templates/MEMORANDUM_IDSS_OD_20042026_NASTAVNICI.dotx by scripts/build-memorandum.mjs.
 * Its headers, footer, logo, background, fonts and margins are kept as they are; only the
 * {{plan}} placeholder in the body is replaced by the plan.
 */
import { patchDocument, PatchType, Paragraph, TextRun } from 'docx';

/** IDSS Blue (CONSTITUTION rule 6 — the five IDSS colours apply to DOCX export too). */
const IDSS_BLUE = '035EA1';
const TITLE = 'Pisana priprema nastavnog časa';

export function planParagraphs(planText: string): Paragraph[] {
  const out: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: TITLE, bold: true, size: 28, color: IDSS_BLUE, font: 'Century Gothic' })],
      spacing: { before: 120, after: 240 },
    }),
  ];
  // The plan uses fixed-width tables (PSI v9, ASCII boxes), so the body stays monospaced
  // to keep the columns aligned; 9 pt fits an 80-character row within the memorandum margins.
  for (const line of planText.replace(/\r/g, '').split('\n')) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: line.length ? line : ' ', font: 'Courier New', size: 18 })],
        spacing: { after: 0, line: 240 },
      }),
    );
  }
  return out;
}

export async function buildPlanOnMemorandum(template: ArrayBuffer | Uint8Array, planText: string): Promise<Uint8Array> {
  return patchDocument(template, {
    patches: { plan: { type: PatchType.DOCUMENT, children: planParagraphs(planText) } },
    keepOriginalStyles: true,
  });
}
