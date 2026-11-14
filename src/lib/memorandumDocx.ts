/**
 * lib/memorandumDocx.ts — the lesson plan as a Word document ON the school's official
 * memorandum (Director, 2026-11-10: "ugradi ovaj memorandum u svaki plan nastavnog časa").
 *
 * The template (src/assets/memorandum/IDSS_memorandum_nastavnici.docx) is built from
 * templates/MEMORANDUM_IDSS_OD_20042026_NASTAVNICI.dotx by scripts/build-memorandum.mjs.
 * Its headers, footer, logo, background, fonts and margins are kept as they are; only the
 * {{plan}} placeholder in the body is replaced by the plan.
 */
import { patchDocument, PatchType, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { structurePlan } from '@/lib/planDocxStructure';

/** IDSS Blue (CONSTITUTION rule 6 — the five IDSS colours apply to DOCX export too). */
const IDSS_BLUE = '035EA1';
const TITLE = 'Pisana priprema nastavnog časa';

const BODY_SIZE = 20; // 10 pt
const TABLE_SIZE = 18; // 9 pt

function cellParagraph(text: string, bold: boolean): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: text || ' ', bold, size: TABLE_SIZE, color: bold ? IDSS_BLUE : undefined })] });
}

function tableOf(rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((cells, i) => new TableRow({
      tableHeader: i === 0,
      children: cells.map((c) => new TableCell({ children: [cellParagraph(c, i === 0)] })),
    })),
  });
}

/** P5-3 (DL-P27): real headings and real tables instead of a monospaced block (QUALITY_FINDINGS U-10).
 *  Every word of the plan is kept (planDocxStructure + its test). ASCII drawings stay monospaced. */
export function planParagraphs(planText: string): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: TITLE, bold: true, size: 28, color: IDSS_BLUE, font: 'Century Gothic' })],
      spacing: { before: 120, after: 240 },
    }),
  ];
  for (const b of structurePlan(planText)) {
    if (b.type === 'heading') {
      out.push(new Paragraph({
        children: [new TextRun({ text: b.text, bold: true, size: 24, color: IDSS_BLUE })],
        spacing: { before: 240, after: 80 },
        keepNext: true,
      }));
    } else if (b.type === 'para') {
      out.push(new Paragraph({ children: [new TextRun({ text: b.text, size: BODY_SIZE })], spacing: { after: 60 } }));
    } else if (b.type === 'mono') {
      out.push(new Paragraph({ children: [new TextRun({ text: b.text, font: 'Courier New', size: 16 })], spacing: { after: 0 } }));
    } else if (b.type === 'table') {
      out.push(tableOf(b.rows));
      out.push(new Paragraph({ children: [], spacing: { after: 120 } }));
    } else {
      out.push(new Paragraph({ children: [], spacing: { after: 60 } }));
    }
  }
  return out;
}

export async function buildPlanOnMemorandum(template: ArrayBuffer | Uint8Array, planText: string): Promise<Uint8Array> {
  return patchDocument(template, {
    patches: { plan: { type: PatchType.DOCUMENT, children: planParagraphs(planText) } },
    keepOriginalStyles: true,
  });
}
