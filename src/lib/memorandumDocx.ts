/**
 * lib/memorandumDocx.ts — the lesson plan as a Word document ON the school's official
 * memorandum (Director, 2026-11-10: "ugradi ovaj memorandum u svaki plan nastavnog časa").
 *
 * The template (src/assets/memorandum/IDSS_memorandum_nastavnici.docx) is built from
 * templates/MEMORANDUM_IDSS_OD_20042026_NASTAVNICI.dotx by scripts/build-memorandum.mjs.
 * Its headers, footer, logo, background, fonts and margins are kept as they are; only the
 * {{plan}} placeholder in the body is replaced by the plan.
 */
import { BorderStyle, patchDocument, PatchType, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { joinWrappedLines, structurePlan } from '@/lib/planDocxStructure';
import { showHeading } from '@/lib/language/dashes';

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
  return [titleParagraph(TITLE), ...textParagraphs(planText)];
}

function titleParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: IDSS_BLUE, font: 'Century Gothic' })],
    spacing: { before: 120, after: 240 },
  });
}

/** Any plan-style text (a plan or an AI answer) as Word paragraphs and tables: headings, paragraphs, tables, drawings. */
export function textParagraphs(text: string): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const b of joinWrappedLines(structurePlan(text))) {
    if (b.type === 'heading') {
      out.push(new Paragraph({
        children: [new TextRun({ text: showHeading(b.text), bold: true, size: 24, color: IDSS_BLUE })],
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

async function onMemorandum(template: ArrayBuffer | Uint8Array, children: (Paragraph | Table)[]): Promise<Uint8Array> {
  return patchDocument(template, {
    patches: { plan: { type: PatchType.DOCUMENT, children } },
    keepOriginalStyles: true,
  });
}

export async function buildPlanOnMemorandum(template: ArrayBuffer | Uint8Array, planText: string): Promise<Uint8Array> {
  return onMemorandum(template, planParagraphs(planText));
}

export interface ConversationEntry { role: string; content: string; timestamp?: string }

/** Director 2026-11-14: the exported conversation is on the school's memorandum too, written like the plan. */
export function conversationParagraphs(entries: ConversationEntry[], planTopic?: string | null, date = new Date()): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [titleParagraph('Zapis razgovora s AI asistentom')];
  const about = [planTopic ? `Pisana priprema: ${planTopic}` : null, `Datum: ${date.toLocaleDateString('bs-BA')}`].filter(Boolean).join(' · ');
  out.push(new Paragraph({ children: [new TextRun({ text: about, size: BODY_SIZE })], spacing: { after: 240 } }));
  for (const m of entries) {
    const teacher = m.role === 'user';
    const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' }) : '';
    out.push(new Paragraph({
      children: [
        new TextRun({ text: teacher ? 'Nastavnik' : 'AI asistent', bold: true, size: 22, color: teacher ? '000000' : IDSS_BLUE }),
        new TextRun({ text: time ? `  ${time}` : '', size: 18 }),
      ],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D9D9D9', space: 6 } },
      spacing: { before: 240, after: 80 },
      keepNext: true,
    }));
    if (teacher) out.push(...m.content.split('\n').filter((l) => l.trim()).map((l) => new Paragraph({ children: [new TextRun({ text: l.trim(), size: BODY_SIZE })], spacing: { after: 60 } })));
    else out.push(...textParagraphs(m.content));
  }
  return out;
}

export async function buildConversationOnMemorandum(template: ArrayBuffer | Uint8Array, entries: ConversationEntry[], planTopic?: string | null): Promise<Uint8Array> {
  return onMemorandum(template, conversationParagraphs(entries, planTopic));
}
