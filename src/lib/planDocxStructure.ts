/**
 * lib/planDocxStructure.ts — P5-3 (Director: "P5 odobren", DL-P27).
 * Turns the plain-text plan (PSI ASCII boxes and tables) into structured blocks, so the Word
 * export can use real headings and real tables instead of a monospaced block of text
 * (QUALITY_FINDINGS U-10). The plan text itself is not changed: every word ends up in a block.
 */

import { headingOf } from './planSegments.ts';

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

/** A line that may belong to a table whose columns are aligned with spaces (no "|"), e.g. an AI rubric. */
const spaceAligned = (l: string) => !!l.trim() && !/^\s*[|│[]/.test(l) && !DRAWING.test(l) && / {3,}\S/.test(l);

/**
 * A table whose columns are aligned with spaces (Director 2026-11-14: an AI rubric showed as "a · b · c" lines).
 * Columns are where EVERY line of the block has a run of at least two spaces. A line whose first cell is empty or
 * starts in lower case continues the row above (a wrapped cell). Null unless there are 3+ columns and 2+ rows.
 */
function alignedTable(lines: string[]): string[][] | null {
  if (lines.length < 2) return null;
  const width = Math.max(...lines.map((l) => l.length));
  const blank = (c: number) => lines.every((l) => c >= l.length || l[c] === ' ');
  const starts: number[] = [];
  for (let c = 0; c < width; c++) {
    if (blank(c)) continue;
    if (c === 0 || (blank(c - 1) && (c < 2 || blank(c - 2)))) starts.push(c);
  }
  if (starts.length < 3) return null;
  const cellsOf = (l: string) => starts.map((s0, k) => l.slice(s0, k + 1 < starts.length ? starts[k + 1] : undefined).trim());
  const rows: string[][] = [];
  for (const l of lines) {
    const cells = cellsOf(l);
    const continues = rows.length > 0 && (!cells[0] || /^\p{Ll}/u.test(cells[0]));
    if (continues) {
      const prev = rows[rows.length - 1];
      cells.forEach((c, i) => { prev[i] = joinCell(prev[i] ?? '', c); });
    } else rows.push(cells);
  }
  const full = rows.filter((r) => r.filter(Boolean).length >= 3).length;
  return rows.length >= 2 && full >= 2 ? rows : null;
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

  const all = planText.replace(/\r/g, '').split('\n');
  for (let idx = 0; idx < all.length; idx++) {
    const line = all[idx].replace(/\s+$/, '');
    if (!table && spaceAligned(line)) {
      let end = idx;
      while (end + 1 < all.length && all[end + 1].trim() && !/^\s*[|│[]/.test(all[end + 1]) && !DRAWING.test(all[end + 1])
        && (/ {3,}\S/.test(all[end + 1]) || /^ {3,}\S/.test(all[end + 1]))) end++;
      const rows = alignedTable(all.slice(idx, end + 1).map((l) => l.replace(/\s+$/, '')));
      if (rows) {
        blocks.push({ type: 'table', rows });
        idx = end;
        continue;
      }
    }
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
    // a heading of the plan's own sections ("UDICA      5 minuta") is a heading too, written with single spaces
    if ((isHeading(trimmed) && !ALIGNED.test(trimmed)) || headingOf(trimmed)) blocks.push({ type: 'heading', text: headingOf(trimmed) ? trimmed.replace(/\s{2,}/g, ' ') : trimmed });
    else if (ALIGNED.test(trimmed) && KEY_VALUE.test(trimmed) && !DRAWING.test(trimmed)) {
      // "Ko predstavlja: …   Kome: …" — label/value pairs, not a drawing: one readable line
      blocks.push({ type: 'para', text: trimmed.replace(/: {2,}/g, ': ').replace(/ {3,}/g, '  ·  ') });
    } else if (ALIGNED.test(trimmed)) blocks.push({ type: 'mono', text: text.replace(/^ {2}/, '') });
    else blocks.push({ type: 'para', text: trimmed });
  }
  closeTable();
  return blocks;
}


/** Lines of the plan are wrapped at about 78 characters inside its boxes. For reading, a line that continues the
 *  sentence of the line before (no closing punctuation before, a lower-case start, or a hyphen break) joins it into
 *  one paragraph (screen and Word, one rule, M-7). Only line breaks change (and a hyphen that split a word at a line break). */
export function joinWrappedLines(blocks: PlanBlock[]): PlanBlock[] {
  const out: PlanBlock[] = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (b.type === 'para' && prev?.type === 'para' && !/^(\[[ xX✓✔]\]|[-•–*]\s|\d+[.)]\s|#{1,6}\s)/.test(b.text) && !/^#{1,6}\s/.test(prev.text)) {
      const p = prev.text.trimEnd();
      const continues = /-$/.test(p) || /,$/.test(p) || (!/[.:?!“”"]$/.test(p) && /^[\p{Ll}(„"']/u.test(b.text.trimStart()));
      if (continues) {
        out[out.length - 1] = { type: 'para', text: /-$/.test(p) ? p.slice(0, -1) + b.text.trimStart() : `${p} ${b.text.trimStart()}` };
        continue;
      }
    }
    out.push(b);
  }
  return out;
}

/** Every non-space character of the plan, in order — used by tests to prove nothing is lost. */
export function contentSignature(text: string): string {
  return text.replace(/[\s|=\-_─━·*~+]/g, '');
}
