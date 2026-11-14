/**
 * lib/planSegments.ts — P6 S2 (DL-P34, DL-P35). ONE place that splits a generated plan into its segments, in order.
 * Used by the workspace ("Nastavnički radni sto") and by "Prepravi ovaj dio" (M-7).
 *
 * A segment starts at a heading line of the plan and runs to the next heading. Every line of the plan belongs to
 * exactly one segment (lines before the first heading belong to the first segment), so nothing is lost and the
 * plan text is never changed. Names and order are those of the plan itself; there is no fixed list.
 */
import { LABELS } from '@/lib/language/templateLines.generated';

export type Audience = 'n' | 'u' | 'nu';

export interface PlanSegment {
  /** The heading line as written in the plan (trimmed, inner spaces collapsed). */
  title: string;
  /** The heading part used for matching, e.g. "UDICA" from "UDICA      5 minuta". */
  head: string;
  /** Minutes stated on the heading line ("5 minuta", "20 min"), if any. */
  minutes: string | null;
  /** Line range in the plan text: [start, end). */
  start: number;
  end: number;
  /** The segment's text without its heading line. */
  body: string;
  /** Teacher (n), students (u) or both (nu) — the approved map, DL-P34. */
  audience: Audience;
}

const DECORATION = /^[\s═=─\-~*_+·#|]*$/;

const fold = (s: string) => s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/Đ/g, 'DJ');

/** The heading part of a candidate line, or null when the line is not a segment heading. */
export function headingOf(line: string): string | null {
  const core = line.trim();
  if (!core || /^[|│[]/.test(core) || DECORATION.test(core)) return null;
  // "Label: value" lines ("ZPD NOTE: …", "VIZUELNI ELEMENT 1: …") are content, not segment headings
  if (/:\s*\S/.test(core)) return null;
  const head = core.split(/\s{2,}|\s+—\s+|\s+\(/)[0].replace(/[:\s]+$/, '');
  const letters = head.replace(/[^\p{L}]/gu, '');
  if (letters.length < 4 || head.length > 70 || head.split(/\s+/).length > 9) return null;
  if (head !== head.toUpperCase() || !/\p{Lu}/u.test(head)) return null;
  return head;
}

// ── Audience map (approved by the Director 2026-11-14, specs/p6-workspace-redesign/AUDIENCE_MAP.md) ──
// Keys are folded Bosnian heading prefixes; German and English headings are mapped through the PSI label table.
const AUDIENCE_BS: [string, Audience][] = [
  ['UDICA', 'u'], ['ISTRAZIVACKO PITANJE', 'u'], ['ISHODI UCENJA', 'nu'], ['UPORISTE U STVARNOM ZIVOTU', 'nu'],
  ['ISTRAZIVACKA FAZA', 'u'], ['DOKAZNI MATERIJAL', 'u'], ['VIZUELNI ELEMENTI', 'u'], ['SKELA', 'n'],
  ['DOKAZ UCENJA', 'u'], ['SAMOEVALUACIJA', 'n'], ['DODATNI RESURSI', 'n'], ['DIFERENCIJACIJA', 'n'],
  ['KLJUCNI POJMOVI', 'u'], ['POVEZANOST SA IB', 'n'], ['IB PROFIL', 'n'], ['PREPORUKE ZA IZVODJENJE', 'n'],
  ['VREMENSKA LINIJA', 'n'], ['MATERIJALI ZA CAS', 'n'], ['TOK CASA', 'nu'], ['PREDSTAVLJANJE NALAZA', 'nu'],
  ['REFLEKSIJA UCENIKA', 'u'], ['UVODNI DIO', 'n'], ['SREDISNJI DIO', 'n'], ['ZAVRSNI DIO', 'n'],
  ['IDEJE ZA PRODUZETAK', 'n'], ['MOGUCI IZAZOVI', 'n'], ['SAVJETI I TRIKOVI', 'n'], ['STA MOZETE URADITI', 'n'],
];

/** German/English label → Bosnian label (folded), from the PSI label table (M-7). */
const TO_BS = new Map<string, string>();
for (const [bs, de, en] of LABELS) {
  TO_BS.set(fold(de), fold(bs));
  TO_BS.set(fold(en), fold(bs));
}

/** Audience of a segment heading. Unknown headings default to the teacher (n); they still show under "Sve". */
export function audienceOf(head: string): Audience {
  let key = fold(head);
  for (const [other, bs] of TO_BS) if (key.startsWith(other) && other.length >= 4) { key = bs; break; }
  for (const [prefix, aud] of AUDIENCE_BS) if (key.startsWith(prefix)) return aud;
  return 'n';
}

const MINUTES = /(\d+\s*(?:-\s*\d+\s*)?(?:minuta|minute|min\.?|Min\.?|Minuten|minutes))\b/;

/** Splits a plan into segments. The concatenation of all segments' lines is the plan, line for line. */
export function parseSegments(planText: string): PlanSegment[] {
  const lines = planText.replace(/\r/g, '').split('\n');
  const starts: { i: number; head: string }[] = [];
  lines.forEach((l, i) => { const h = headingOf(l); if (h) starts.push({ i, head: h }); });
  if (starts.length === 0) {
    return [{ title: 'Priprema', head: 'Priprema', minutes: null, start: 0, end: lines.length, body: lines.join('\n'), audience: 'n' }];
  }
  return starts.map((s, k) => {
    const start = k === 0 ? 0 : s.i;
    const end = k + 1 < starts.length ? starts[k + 1].i : lines.length;
    const titleLine = lines[s.i].trim().replace(/\s{2,}/g, '  ');
    const bodyLines = lines.slice(start, end).filter((_, idx) => start + idx !== s.i);
    const minutes = titleLine.match(MINUTES)?.[1] ?? null;
    return { title: titleLine.replace(/\s{2,}/g, ' '), head: s.head, minutes, start, end, body: bodyLines.join('\n'), audience: audienceOf(s.head) };
  });
}

/** The plan with one segment's lines replaced (used by "Prepravi ovaj dio"). */
export function replaceSegment(planText: string, index: number, newSegmentText: string): string {
  const lines = planText.replace(/\r/g, '').split('\n');
  const seg = parseSegments(planText)[index];
  if (!seg) return planText;
  return [...lines.slice(0, seg.start), ...newSegmentText.split('\n'), ...lines.slice(seg.end)].join('\n');
}
