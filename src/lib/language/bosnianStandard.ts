// Bosnian standard language layer (Director, 2026-11-13; DL-P19).
// "Every displayed text in a Bosnian plan is standard Bosnian: Latin script, no Serbisms, no Croatisms."
//
// ONE source (M-7), used by the browser (useChat: correction while the plan streams, zero extra wait) and
// by the Edge validator (check `bosnian_standard`: what could not be corrected automatically).
// No imports, so both Vite and Deno can load this file.
//
// Two lists:
//  1. SAFE_FIXES: a word whose standard form has the SAME grammar (only the stem changes, endings stay):
//     corrected automatically, e.g. "točno" → "tačno", "deca" → "djeca".
//  2. FLAGGED: the standard word declines differently ("rajčica" → "paradajz", "tjedan" → "sedmica"), so a
//     mechanical swap could break the sentence. These are flagged; "Popravi" asks the AI to rewrite them.
// The lists are the Director's to extend or change.

const L = "\\p{L}";
/** Whole-word pattern: no letter or hyphen directly before/after (so "Pre-op" or "PRE-OUTPUT" in an English
 *  term is never touched); `stem` + optional letters after when `prefix`. */
const word = (body: string, prefix: boolean) => new RegExp(`(?<![${L}-])(${body})${prefix ? `(${L}*)` : "()"}(?![${L}-])`, "giu");

type Fix = { re: RegExp; to: string };
// [wrong stem, correct stem, prefix?]  prefix = the endings after the stem are kept (točn|o → tačn|o).
const SAFE: [string, string, boolean][] = [
  ["točn", "tačn", true], ["netočn", "netačn", true],
  // "točka" (point) only — "točak/točkovi" (wheel) is correct Bosnian
  ["točka", "tačka", false], ["točke", "tačke", false], ["točki", "tački", false], ["točku", "tačku", false],
  ["točkom", "tačkom", false], ["točkama", "tačkama", false],
  ["kemi", "hemi", true], ["istori", "histori", true],
  ["opštin", "općin", true], ["opšt", "opć", true], ["uopšte", "uopće", false],
  ["hleb", "hljeb", true],
  // ekavian → ijekavian (exact forms only: "dec…" would also hit "decembar")
  ["reč", "riječ", false], ["reči", "riječi", false], ["rečima", "riječima", false],
  ["deca", "djeca", false], ["dece", "djece", false], ["decom", "djecom", false],
  ["dete", "dijete", false], ["deteta", "djeteta", false], ["detetu", "djetetu", false],
  ["vreme", "vrijeme", false], ["mesto", "mjesto", false], ["mesta", "mjesta", false], ["mestu", "mjestu", false],
  ["mleko", "mlijeko", false], ["lepo", "lijepo", false], ["lepa", "lijepa", false], ["lep", "lijep", false],
  ["gde", "gdje", false], ["ovde", "ovdje", false], ["uvek", "uvijek", false],
  ["posle", "poslije", false],
  ["primer", "primjer", true], ["pesm", "pjesm", true], ["reka", "rijeka", false], ["reke", "rijeke", false],
  ["cvet", "cvijet", false],
];
const SAFE_FIXES: Fix[] = SAFE.map(([from, to, prefix]) => ({ re: word(from, prefix), to }));

/** Keeps the case pattern of the original: TAČNO, Tačno, tačno. */
function withCase(original: string, replacement: string): string {
  if (original === original.toUpperCase() && original !== original.toLowerCase()) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

/** Automatic, grammar-safe corrections. Idempotent; runs in a few milliseconds on a full plan. */
export function normalizeBosnian(text: string): string {
  let out = text;
  for (const { re, to } of SAFE_FIXES) {
    out = out.replace(re, (_m: string, stem: string, rest: string) => withCase(stem, to) + (rest ?? ""));
  }
  return out;
}

export type FlaggedWord = { found: string; standard: string };
// [regex body, prefix?, standard word]. Exact forms where a stem would also hit a correct Bosnian word
// ("vlakno", "siječe", "kolovoz" = roadway, which is why August is not listed).
const FLAGGED: [string, boolean, string][] = [
  ["rajčic", true, "paradajz"], ["tjedn", true, "sedmica"], ["tjedan", false, "sedmica"], ["kruh", true, "hljeb"], // Director 2026-11-13: only "hljeb"
  ["sveučilišt", true, "univerzitet"], ["nogomet", true, "fudbal"], ["glazb", true, "muzika"],
  ["kazališt", true, "pozorište"], ["povijes", true, "historija"], ["znanost", true, "nauka"],
  ["znanstven", true, "naučni"], ["obitelj", true, "porodica"], ["tvornic", true, "fabrika"], // Director 2026-11-13: only "fabrika"
  ["vlak(?:a|u|om|ovi|ova|ovima)?", false, "voz"], ["bezbedn", true, "siguran / sigurnost"],
  ["siječ(?:anj|nja|nju)", false, "januar"], ["veljač", true, "februar"], ["ožuj", true, "mart"],
  ["trav(?:anj|nja|nju)", false, "april"], ["svib(?:anj|nja|nju)", false, "maj"], ["lip(?:anj|nja|nju)", false, "juni"],
  ["srp(?:anj|nja|nju)", false, "juli"], ["ruj(?:an|na|nu)", false, "septembar"], ["listopad", true, "oktobar"],
  ["studen(?:og|om)", false, "novembar"], ["prosin(?:ac|ca|cu)", false, "decembar"],
];
const FLAGGED_RES: [RegExp, string][] = FLAGGED.map(([body, prefix, std]) => [word(body, prefix), std]);

/** Words that need a rewrite, not a swap. The Bosnian signature/footer is checked like everything else. */
export function findNonStandardBosnian(text: string): FlaggedWord[] {
  const hits: FlaggedWord[] = [];
  for (const [re, standard] of FLAGGED_RES) {
    for (const m of text.matchAll(re)) hits.push({ found: m[0], standard });
  }
  return hits;
}

/** Cyrillic letters in a Bosnian plan (the standard is Latin script). */
export const hasCyrillic = (text: string): boolean => /\p{Script=Cyrillic}/u.test(text);
