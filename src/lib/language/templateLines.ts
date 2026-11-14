// DL-P30 (Director, 2026-11-14: "kontrolni sloj DE/EN"). German and English plans sometimes copy a fixed
// Bosnian template line of the PSI word for word. This layer replaces every such EXACT line with its German or
// English line from the PSI list (Module 3.10, DL-P29; generated data, one source, M-7). It runs while the plan
// streams, in milliseconds, with no extra AI call. Free Bosnian text that is not a known template line is not
// touched; the eval check `language_purity` still reports it.
// No imports except generated data, so both Vite and Deno can load this file.
import { TEMPLATE_LINES } from "./templateLines.generated.ts";

type Rule = { re: RegExp; to: string };
const L = "\\p{L}";
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const unquote = (s: string) => s.replace(/^["„“]|["“”]$/g, "");
// The spaces after the line are captured, and whether a | follows, so a table cell keeps its width.
const pattern = (bs: string) => new RegExp(`(?<![${L}])${escape(bs).replace(/ +/g, "\\s+")}(?![${L}])( *)(?=(\\|)?)`, "gu");
/** Replacement that keeps the width of an ASCII table cell: pad when shorter, use up spaces when longer
 *  (always leaving one space before the next |). */
function keepWidth(match: string, trailing: string, bar: string | undefined, to: string): string {
  if (!trailing || !bar) return to + trailing; // prose: the spaces stay as written
  const width = match.length;
  return to.length + 1 <= width ? to.padEnd(width) : to + " ".repeat(Math.max(1, width - to.length));
}

function rulesFor(col: 1 | 2): Rule[] {
  const pairs: [string, string][] = [];
  for (const row of TEMPLATE_LINES) {
    const bs = unquote(row[0]);
    const to = unquote(row[col]);
    if (bs.includes("[")) continue; // a line with placeholders is filled in by the AI, never copied as is
    pairs.push([bs, to]);
    // Lists of single labels ("Udica / Istraživanje / …"): each label on its own, when the lists line up
    const bsParts = bs.split(" / ");
    const toParts = to.split(" / ");
    if (bsParts.length >= 4 && bsParts.length === toParts.length) {
      bsParts.forEach((p, i) => { if (p !== toParts[i]) pairs.push([p, toParts[i]]); });
    }
  }
  const all: [string, string][] = [];
  for (const [bs, to] of pairs) {
    all.push([bs, to]);
    if (bs.toUpperCase() !== bs) all.push([bs.toUpperCase(), to.toUpperCase()]); // headings and table cells
  }
  all.sort((a, b) => b[0].length - a[0].length); // the longest line first, so a part never breaks a whole line
  return all.map(([bs, to]) => ({ re: pattern(bs), to }));
}

const RULES: Record<"german" | "english", Rule[]> = { german: rulesFor(1), english: rulesFor(2) };

/** German/English plan: exact Bosnian template lines → their German/English line. Idempotent. */
export function normalizeTemplateLines(text: string, language: string | null | undefined): string {
  if (language !== "german" && language !== "english") return text;
  let out = text;
  for (const { re, to } of RULES[language]) out = out.replace(re, (m: string, trailing: string, bar?: string) => keepWidth(m, trailing, bar, to));
  return out;
}
