// L-2 step 1 (Director, 2026-11-14: "L-2 korak 1", DL-P32). Model typos in fixed headings ("TIPPPS & TRICKS")
// break the structure checks and look careless. Every heading of a plan comes from the PSI label table
// (Module 3.10, generated data, M-7), so a heading line that differs from a known heading by one or two letters is
// corrected to the exact heading. Only complete ALL-CAPS heading lines are touched; text is never changed.
// It runs while the plan streams and when a stored plan is shown, in milliseconds, with no AI call.
// Only relative ".ts" imports, so both Vite and Deno can load this file.
import { LABELS } from "./templateLines.generated.ts";

type Lang = "bosnian" | "german" | "english";
const COL: Record<Lang, 0 | 1 | 2> = { bosnian: 0, german: 1, english: 2 };

/** Headings of one language: the ALL-CAPS labels of the PSI table (sub-labels in mixed case are not headings). */
function headingsFor(lang: Lang): string[] {
  const out = new Set<string>();
  for (const row of LABELS) {
    const h = row[COL[lang]].trim();
    if (h.length >= 6 && h === h.toUpperCase() && /\p{Lu}/u.test(h)) out.add(h);
  }
  return [...out];
}
const HEADINGS: Record<Lang, string[]> = { bosnian: headingsFor("bosnian"), german: headingsFor("german"), english: headingsFor("english") };

/** Levenshtein distance, stopping early above `max`. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** The exact heading for a misspelled one, or null (no change). Headings of 10+ letters only; one wrong letter,
 *  two from 14 letters on. */
export function correctHeading(candidate: string, language: string | null | undefined): string | null {
  const lang = language as Lang;
  const list = HEADINGS[lang];
  if (!list) return null;
  if (candidate.length < 10 || list.includes(candidate)) return null; // short words: an inflection, not a typo
  const max = candidate.length >= 14 ? 2 : 1;
  let found: string | null = null;
  for (const h of list) {
    // a longer/shorter ending ("IZAZOVI" / "IZAZOV") is grammar, not a typo: never "correct" it
    if (h.startsWith(candidate) || candidate.startsWith(h)) continue;
    if (distance(candidate, h, max) <= max) {
      if (found && found !== h) return null; // two possible headings: never guess
      found = h;
    }
  }
  return found;
}

const BOX = /^(\s*[|║]?\s*)(.*?)(\s*[|║]?\s*)$/;

/** Corrects misspelled fixed headings. Only complete lines (the last, still-streaming line is left alone). */
export function fixHeadingTypos(text: string, language: string | null | undefined): string {
  if (!HEADINGS[language as Lang]) return text;
  const lines = text.split("\n");
  const last = text.endsWith("\n") ? lines.length : lines.length - 1;
  for (let i = 0; i < last; i++) {
    const m = lines[i].match(BOX);
    if (!m) continue;
    const core = m[2];
    // "KLJUČNI POJMOVI — 5. razred" keeps its suffix; only the heading part is compared
    const sep = core.search(/\s+[—:(]/);
    const head = sep > 0 ? core.slice(0, sep) : core;
    if (head.length < 10 || head !== head.toUpperCase() || !/\p{Lu}{3}/u.test(head)) continue;
    const fixed = correctHeading(head, language);
    if (fixed) lines[i] = m[1] + fixed + core.slice(head.length) + m[3];
  }
  return lines.join("\n");
}

/** Words with the same letter three times in a row ("Učeniccci") in Bosnian and English plans. German is left
 *  out: "Schifffahrt" is correct German. Web addresses and Roman numerals are ignored. */
export function findTripleLetters(text: string, language: string | null | undefined): string[] {
  if (language !== "bosnian" && language !== "english") return [];
  const hits = new Set<string>();
  for (const m of text.matchAll(/\p{L}+/gu)) {
    const w = m[0];
    if (/^(?:www|[IVXLCDM]+)$/i.test(w)) continue;
    if (/(\p{L})\1\1/iu.test(w)) hits.add(w);
  }
  return [...hits];
}
