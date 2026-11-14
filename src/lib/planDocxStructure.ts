/**
 * lib/planDocxStructure.ts — P5-3 (Director: "P5 odobren", DL-P27).
 * Turns the plain-text plan (PSI ASCII boxes and tables) into structured blocks, so the Word
 * export can use real headings and real tables instead of a monospaced block of text
 * (QUALITY_FINDINGS U-10). The plan text itself is not changed: every word ends up in a block.
 */

export type PlanBlock =
  | { type: 'heading'; text: string }
  | { type: 'para'; text: string }
  | { type: 'mono'; text: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'blank' };

/** Lines that are only decoration: ====, ----, ____, +----+ … */
const RULE = /^\s*\+?[=\-_─━·*~]{6,}\+?\s*$/;
/** A table separator row inside a table: |-----|:---:|  */
const TABLE_RULE = /^[\s|:+\-=─]+$/;
/** "Label: value" at the start of a line. */
const KEY_VALUE = /^([^:|]{1,40}:\s*\S|\d+\.\s)/;
/** Drawing characters and arrows: such lines keep their exact spacing. */
const DRAWING = /[┌┐└┘├┤│─┼]|-->|<--|==>|<==|\/\\|\\\//;
/** Aligned text or ASCII drawings keep their spacing (board drawings, A8). */
const ALIGNED = /\S {3,}\S|[┌┐└┘├┤│─┼]/;

function isHeading(text: string): boolean {
  // "REFLEKSIJA UČENIKA (pitanja za učenike)" — the part before a trailing (…) decides
  const base = text.replace(/\s*\([^)]*\)\s*:?$/, '');
  const letters = base.replace(/[^\p{L}]/gu, '');
  return letters.length >= 4 && text.length <= 80 && letters === letters.toUpperCase() && /\p{Lu}/u.test(letters);
}

/** Cells of a "| a | b |" line, or null when the line is not a multi-column row. */
function rowCells(line: string): string[] | null {
  const t = line.trim();
  if (!t.startsWith('|')) return null;
  const parts = t.split('|');
  // "| a | b |" → ['', ' a ', ' b ', ''] — drop the outer empties
  if (parts[0].trim() === '') parts.shift();
  if (parts.length && parts[parts.length - 1].trim() === '') parts.pop();
  return parts.length >= 2 ? parts.map((c) => c.trim()) : null;
}

/** Joins a wrapped cell: "INDIVIDU-" + "ALNO" → "INDIVIDUALNO"; otherwise with a space. */
function joinCell(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return a.endsWith('-') ? a.slice(0, -1) + b : `${a} ${b}`;
}

export function structurePlan(planText: string): PlanBlock[] {
  const blocks: PlanBlock[] = [];
  let table: string[][] | null = null;
  let tableRaw: string[] = [];
  const closeTable = () => {
    if (!table) return;
    if (table.length < 2) {
      // one "row" with pipes is an ASCII drawing (e.g. "BILJKA |--- CO2"), not a table: keep it as drawn
      for (const l of tableRaw) blocks.push({ type: 'mono', text: l });
    } else {
      const width = Math.max(...table.map((r) => r.length));
      blocks.push({ type: 'table', rows: table.map((r) => [...r, ...Array(width - r.length).fill('')]) });
    }
    table = null;
    tableRaw = [];
  };

  for (const raw of planText.replace(/\r/g, '').split('\n')) {
    const line = raw.replace(/\s+$/, '');
    const cells = rowCells(line);
    if (cells) {
      tableRaw.push(line);
      if (TABLE_RULE.test(line)) continue; // |----|----| inside a table
      const totalRow = cells.some((c) => /^(Ukupno|Gesamt|Total)\b/i.test(c));
      if (table && cells[0] === '' && table.length && !totalRow) {
        // continuation of the previous row (wrapped cells)
        const prev = table[table.length - 1];
        cells.forEach((c, i) => { prev[i] = joinCell(prev[i] ?? '', c); });
      } else {
        table = table ?? [];
        table.push(cells);
      }
      continue;
    }
    closeTable();
    if (RULE.test(line)) continue;
    // single-cell box line "|  text  |" → its text
    const boxed = line.trim().startsWith('|') ? line.trim().replace(/^\|/, '').replace(/\|$/, '') : line;
    const text = boxed.replace(/\s+$/, '');
    // a rule drawn inside a box ("|------|") is decoration too, never text (Director 2026-11-14)
    if (/^[\s\-=_─━·*~+]{3,}$/.test(text) && /[-=_─━]{3,}/.test(text)) {
      if (blocks.length && blocks[blocks.length - 1].type !== 'blank') blocks.push({ type: 'blank' });
      continue;
    }
    if (!text.trim()) {
      if (blocks.length && blocks[blocks.length - 1].type !== 'blank') blocks.push({ type: 'blank' });
      continue;
    }
    const trimmed = text.trim();
    if (isHeading(trimmed) && !ALIGNED.test(trimmed)) blocks.push({ type: 'heading', text: trimmed });
    else if (ALIGNED.test(trimmed) && KEY_VALUE.test(trimmed) && !DRAWING.test(trimmed)) {
      // "Ko predstavlja: …   Kome: …" — label/value pairs, not a drawing: one readable line
      blocks.push({ type: 'para', text: trimmed.replace(/: {2,}/g, ': ').replace(/ {3,}/g, '  ·  ') });
    } else if (ALIGNED.test(trimmed)) blocks.push({ type: 'mono', text: text.replace(/^ {2}/, '') });
    else blocks.push({ type: 'para', text: trimmed });
  }
  closeTable();
  return blocks;
}

/** Every non-space character of the plan, in order — used by tests to prove nothing is lost. */
export function contentSignature(text: string): string {
  return text.replace(/[\s|=\-_─━·*~+]/g, '');
}
