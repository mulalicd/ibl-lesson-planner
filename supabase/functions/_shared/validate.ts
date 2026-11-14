import { findNonStandardBosnian, hasCyrillic, normalizeBosnian } from "../../../src/lib/language/bosnianStandard.ts";
// validatePlan — deterministic quality checks for a generated IBL plan (P3).
//
// Pure function, no I/O. Used by the ibl-chat Edge Function (final SSE
// event), by the golden evaluation (scripts/eval) and by tests.
// Works on BOTH output formats: the pre-P3 "v8.1" template ("SECTION N")
// and PSI v8.0/v9.0 (localised headings, boxed tables).
// A check that cannot find its evidence FAILS. It never passes by default.

export type Language = "bosnian" | "german" | "english";
export type Tier = "MICRO" | "STANDARD" | "EXTENDED";

export interface ValidateParams {
  language: Language;
  duration_min: number;
  tier?: Tier;
  /** P4 (PSI v9.1, A16): add the lesson-flow checks. Only for plans written under v9.1. */
  pedagogy?: boolean;
  /** L-3: Bosnian words in German/English plans. Eval only until the Director approves a badge label. */
  languagePurity?: boolean;
}

export interface CheckResult {
  id: string;
  ok: boolean;
  detail: string;
}

export interface ValidationReport {
  passed: number;
  total: number;
  failed: string[];
  checks: CheckResult[];
}

const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "dj").replace(/Đ/g, "DJ");  // PSI ASCII spelling: Đ → DJ

// Section keywords per language (matched on diacritic-folded, upper-cased text).
const SECTIONS: Record<string, string[]> = {
  iq: ["ISTRAZIVACKO PITANJE", "FORSCHUNGSFRAGE", "INQUIRY QUESTION"],
  hook: ["UDICA", "EINSTIEG", "HOOK"],
  evidence: ["DOKAZNI MATERIJAL", "BEWEISMATERIAL", "EVIDENCE MATERIAL", "ISTRAZIVACKA FAZA", "RECHERCHEPHASE"],
  socratic: ["SOKRAT", "SKELA", "GERUST", "SCAFFOLD", "SOCRATIC"],
  learningEvidence: ["DOKAZ UCENJA", "LERNNACHWEIS", "LEARNING EVIDENCE", "EVIDENCE OF LEARNING"],
  selfEval: ["SAMOEVALUACIJA", "SELBSTREFLEXION", "SELF-EVALUATION", "SELF EVALUATION"],
  differentiation: ["DIFERENCIJACIJA", "DIFFERENZIERUNG", "DIFFERENTIATION", "SUPPORT PATH", "PODRSKA"],
  delivery: ["PREPORUKE ZA IZVODJENJE", "UNTERRICHTSEMPFEHLUNG", "EMPFEHLUNGEN ZUR DURCHFUHRUNG", "DELIVERY RECOMMENDATION", "LESSON DELIVERY"],
  // Director requirements (2026-11-07, PSI v9 A6/A12/A13):
  outcomes: ["ISHODI UCENJA", "LERNERGEBNISSE", "LEARNING OUTCOMES"],
  realLife: ["UPORISTE U STVARNOM ZIVOTU", "BEZUG ZUM ALLTAG", "REAL-LIFE CONNECTION", "REAL LIFE CONNECTION"],
  tips: ["SAVJETI I TRIKOVI", "TIPPS & TRICKS", "TIPS & TRICKS", "TIPS AND TRICKS"],
};

// P4 (A16) sections, matched like SECTIONS (diacritic-folded, upper-cased).
const PEDAGOGY_SECTIONS: Record<string, string[]> = {
  materials: ["MATERIJALI ZA CAS", "MATERIALIEN FUR DIE STUNDE", "MATERIALS FOR THE LESSON"],
  flow: ["TOK CASA", "STUNDENVERLAUF", "LESSON FLOW"],
  presentation: ["PREDSTAVLJANJE NALAZA", "PRASENTATION DER ERGEBNISSE", "PRESENTING FINDINGS"],
  studentReflection: ["REFLEKSIJA UCENIKA", "SCHULERREFLEXION", "STUDENT REFLECTION"],
};
// Forms of work, any inflection (Grupa/Grupe/u grupama, u paru/u parovima, Frontalno/frontalni rad …).
// Bosnian words that never occur in correct German or English text ("da", "je", "i" excluded: they do).
const BOSNIAN_FUNCTION_WORDS = /(?<![\p{L}-])(su|na|za|se|od|kako|koji|koja|koje|nije|ili|šta|što|učenici|učenik|učenika|nastavnik|nastavnica|časa|čas|odgovor|pitanje)(?![\p{L}-])/gu;
const GROUPING = /(INDIVID|SAMOSTALN|U PAR|PAROVI|GRUP|FRONTAL|CIJELI RAZRED|EINZEL|PARTNER|GRUPPE|PLENUM|PAIRS?\b|GROUPS?\b|WHOLE CLASS)/;
const ALL_HEADINGS = [...Object.values(SECTIONS).flat(), ...Object.values(PEDAGOGY_SECTIONS).flat()];

/** Lines of the section that starts at the first line containing one of `keys`, up to the next known heading. */
function sectionLines(foldedLines: string[], keys: string[], maxLines = 40): string[] {
  const start = foldedLines.findIndex((l) => keys.some((k) => l.includes(k)));
  if (start < 0) return [];
  const out: string[] = [];
  for (let i = start + 1; i < Math.min(foldedLines.length, start + 1 + maxLines); i++) {
    const l = foldedLines[i];
    if (ALL_HEADINGS.some((h) => l.includes(h) && !keys.includes(h)) && !l.includes("|")) break;
    out.push(l);
  }
  return out;
}

function pedagogyChecks(text: string, add: (id: string, ok: boolean, detail: string) => void): void {
  const upper = fold(text).toUpperCase();
  const foldedLines = upper.split("\n");
  for (const key of Object.keys(PEDAGOGY_SECTIONS)) {
    const ok = PEDAGOGY_SECTIONS[key].some((k) => upper.includes(k));
    add(`section_${key}`, ok, ok ? "present" : "missing");
  }
  // P4-7: every phase row says who (form) and for how long (minutes)
  const flow = sectionLines(foldedLines, PEDAGOGY_SECTIONS.flow);
  // A table row may wrap over several lines: a line whose first cell is empty continues the row above it.
  // Cells are joined column by column; a piece ending in "-" joins the next piece without a space
  // ("INDIVIDU-" + "ALNO" = "INDIVIDUALNO"). A phase row is one whose FIRST cell holds the minutes.
  const merged: string[][] = [];
  for (const l of flow) {
    if ((l.match(/\|/g) ?? []).length < 4) continue;
    const cells = l.split("|").slice(1, -1).map((c) => c.trim());
    if (cells[0] === "" && merged.length) {
      const row = merged[merged.length - 1];
      cells.forEach((c, i) => {
        if (!c) return;
        row[i] = row[i] ? (row[i].endsWith("-") ? row[i].slice(0, -1) + c : `${row[i]} ${c}`) : c;
      });
    } else merged.push(cells);
  }
  const rows = merged.filter((c) => /^\d{1,3}\s*([-–]\s*\d{1,3})?\s*(MIN)?$/.test(c[0] ?? "") && !/UKUPNO|GESAMT|TOTAL/.test(c.join(" ")))
    .map((c) => `| ${c.join(" | ")} |`);
  const withForm = rows.filter((l) => GROUPING.test(l)).length;
  add("phases_complete", rows.length >= 3 && withForm === rows.length,
    rows.length < 3 ? `only ${rows.length} phase rows with minutes`
      : `${withForm}/${rows.length} rows state the form of work${withForm < rows.length ? `; e.g. ${rows.find((l) => !GROUPING.test(l))!.replace(/\s+/g, " ").trim().slice(0, 160)}` : ""}`);
  // P4-6: every outcome I1–I4 is used again later in the plan, and there is one "Mogu …" per outcome
  const outcomeLines = sectionLines(foldedLines, SECTIONS.outcomes, 30).join("\n");
  const ids = [...new Set([...outcomeLines.matchAll(/\bI([1-4])\b/g)].map((m) => m[1]))];
  const afterOutcomes = upper.slice(upper.indexOf(outcomeLines) + outcomeLines.length);
  const unreferenced = ids.filter((d) => !new RegExp(`\\bI${d}\\b`).test(afterOutcomes));
  const criteria = (text.match(/^\s*\|?\s*(\[[ xX]\]\s*)?(Mogu|Ich kann|I can)\b/gim) ?? []).length;
  add("outcomes_aligned", ids.length >= 3 && unreferenced.length === 0 && criteria >= ids.length,
    ids.length < 3 ? `${ids.length} outcomes found` : unreferenced.length ? `not used later: I${unreferenced.join(", I")}` : `${criteria} criteria for ${ids.length} outcomes`);
}

// English template labels that must not appear in a Bosnian or German plan.
const ENGLISH_LABELS = [
  /^\s*SECTION \d+/m, /INQUIRY QUESTION/, /Student Response/i, /Teacher Follow-up/i,
  /\bUSAGE INSTRUCTIONS\b/, /\bSERVES IQ NOTE\b/, /\bIQ COHERENCE NOTE\b/, /\bBLOOM'S LEVEL\b/,
  /\bKEY VOCABULARY\b/, /\bSUPPORT PATH\b/, /\bEXTENSION PATH\b/, /\bBITE YOUR TONGUE\b/,
  /\bRETURN THE BALL\b/, /\bSUPPORT DOUBT\b/, /^\s*School:/m, /^\s*Topic:/m, /^\s*Duration:/m,
];

// Bosnian headings written without diacritics (DL-P13 item 3: correct spelling required).
const ASCII_FOLDED_BS = [/ISTRAZIVACKO PITANJE/, /DOKAZ UCENJA/, /\bSkola:/, /PREPORUKE ZA IZVODJENJE CASA/, /\bZAKLJUCAK\b/, /\bcasa\b/];

// Footer + the PSI 3.13 "next steps" block (~2,000 chars incl. box borders).
const MAX_AFTER_FOOTER = 4000;

// A NAMED external source: a platform, a URL, a publisher or a page reference.
// Generic words ("udžbenik", "textbook", "kanal") are not sources by themselves
// (false positive on "…what a factual textbook might miss", eval run 42834108139).
const SOURCE_HINT = /(youtube|youtu\.be|https?:\/\/|www\.|\bverlag\b|\bstr\.\s*\d|\bs\.\s*\d|\bseite\s*\d|\bpage\s*\d|\bp\.\s*\d)/i;
const VERIFY_MARK = /(ZA PROVJERU|ZU PR(Ü|UE)FEN|TO VERIFY)/i;

function hasSection(foldedUpper: string, key: string): boolean {
  return SECTIONS[key].some((k) => foldedUpper.includes(k));
}

function timelineCheck(text: string, duration: number): CheckResult {
  const folded = fold(text);
  // 1) explicit total line: "Ukupno: 45 min" / "Gesamt: 45 Min" / "Insgesamt: 45 Minuten" / "Total: 45 min"
  // Up to 60 characters between the word and the number: boxed tables pad with spaces
  // ("|  Total:                               45 min", eval run 42834108139).
  const total = folded.match(/\b(UKUPNO|INSGESAMT|GESAMTDAUER|GESAMT|SUMME|TOTAL)\b[^\n\d]{0,60}(\d{1,3})\s*min/i);
  // 2) clock ranges "00:40-00:45" and minute ranges "40-45 min"
  let maxEnd = 0;
  let ranges = 0;
  for (const m of folded.matchAll(/\b(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})\b/g)) {
    maxEnd = Math.max(maxEnd, Number(m[3]) * 60 + Number(m[4]));
    ranges++;
  }
  for (const m of folded.matchAll(/\b(\d{1,3})\s*[-–]\s*(\d{1,3})\s*min/gi)) {
    maxEnd = Math.max(maxEnd, Number(m[2]));
    ranges++;
  }
  if (total) {
    const t = Number(total[2]);
    return { id: "timeline_matches_duration", ok: t === duration, detail: `total ${t} min vs ${duration} min` };
  }
  if (ranges === 0) return { id: "timeline_matches_duration", ok: false, detail: "no timeline found" };
  return { id: "timeline_matches_duration", ok: maxEnd === duration, detail: `timeline ends at ${maxEnd} min vs ${duration} min` };
}

export function validatePlan(text: string, params: ValidateParams): ValidationReport {
  const checks: CheckResult[] = [];
  const upper = fold(text).toUpperCase();
  const add = (id: string, ok: boolean, detail: string) => checks.push({ id, ok, detail });

  // Structure
  for (const key of Object.keys(SECTIONS)) {
    add(`section_${key}`, hasSection(upper, key), hasSection(upper, key) ? "present" : "missing");
  }

  // Inquiry question: a heading followed (within 6 lines) by a line ending in "?"
  const lines = text.split("\n");
  let iqLine = "";
  for (let i = 0; i < lines.length && !iqLine; i++) {
    if (SECTIONS.iq.some((k) => fold(lines[i]).toUpperCase().includes(k))) {
      for (let j = i; j < Math.min(lines.length, i + 7); j++) {
        const cand = lines[j].replace(/^[|\s>"„“]+|[|\s"“”]+$/g, "");
        if (cand.length > 15 && cand.endsWith("?")) { iqLine = cand; break; }
      }
    }
  }
  add("iq_is_a_question", !!iqLine, iqLine ? iqLine.slice(0, 120) : "no question found after the heading");

  // Tips & Tricks is the closing section: after delivery recommendations, before the footer
  const tipsAt = Math.max(...SECTIONS.tips.map((k) => upper.lastIndexOf(k)));
  const footerAtU = upper.lastIndexOf("MAJ");
  add("tips_before_footer", tipsAt >= 0 && footerAtU > tipsAt, tipsAt < 0 ? "no tips section" : footerAtU > tipsAt ? "ok" : "tips after footer");

  // Synthesis / return to the IQ (PSI 2.6/2.10)
  const synth = /(SINTEZ|SYNTHES|RETURN TO (THE )?IQ|POVRATAK NA|RUCKKEHR|RUECKKEHR)/.test(upper);
  add("socratic_synthesis_present", synth, synth ? "present" : "missing");

  // Timeline
  checks.push(timelineCheck(text, params.duration_min));

  // Footer contact (DL-P10) and truncation (footer must be near the end)
  const footerIdx = text.lastIndexOf("maja.ljubovic@idss.ba");
  add("footer_contact", footerIdx >= 0, footerIdx >= 0 ? "present" : "missing or old address");
  // Truncation: the footer block (any address) must close the plan. PSI v9 A15
  // allows only the short "ŠTA MOŽETE URADITI SLJEDEĆE" app hint after it.
  const footerMarker = Math.max(...[/Maj[ai] Ljubovi[cć]/gi].flatMap((re) => [...text.matchAll(re)].map((m) => m.index ?? -1)), -1);
  const afterFooter = footerMarker >= 0 ? text.length - footerMarker : -1;
  add(
    "not_truncated",
    footerMarker >= 0 && afterFooter < MAX_AFTER_FOOTER,
    footerMarker < 0 ? "no footer → likely truncated" : afterFooter < MAX_AFTER_FOOTER ? "footer closes the plan" : `${afterFooter} chars after the footer`,
  );

  // No invented date (PSI 3.1 leaves the date blank)
  const dateLine = lines.find((l) => /^\s*\|?\s*(Datum|Date)\s*:/i.test(l)) ?? "";
  const invented = /\d{4}-\d{2}-\d{2}|\d{1,2}\.\s?\d{1,2}\.\s?\d{4}/.test(dateLine);
  add("no_invented_date", !invented, invented ? dateLine.trim().slice(0, 80) : "blank or absent");

  // Language consistency
  if (params.language !== "english") {
    const hits = ENGLISH_LABELS.filter((re) => re.test(text)).map((re) => re.source.replace(/\\b|\^|\\s\*|\/m/g, ""));
    add("no_english_labels", hits.length === 0, hits.length ? `found: ${hits.slice(0, 5).join(", ")}` : "none");
  }
  if (params.language === "bosnian") {
    const ascii = ASCII_FOLDED_BS.filter((re) => re.test(text)).map((re) => re.source);
    const hasDiacritics = /[čćšžđČĆŠŽĐ]/.test(text);
    add("bosnian_diacritics", ascii.length === 0 && hasDiacritics, ascii.length ? `ASCII headings: ${ascii.join(", ")}` : hasDiacritics ? "ok" : "no diacritics at all");
    // DL-P19: standard Bosnian, Latin script. Grammar-safe fixes are applied in the browser (normalizeBosnian);
    // this check reports what needs a rewrite, as "found → standard", so "Popravi" can name the words.
    const fixed = normalizeBosnian(text);
    const flagged = findNonStandardBosnian(fixed);
    const cyr = hasCyrillic(fixed);
    const uniq = [...new Set(flagged.map((h) => `${h.found} → ${h.standard}`))];
    add("bosnian_standard", flagged.length === 0 && !cyr,
      cyr ? "Cyrillic letters found" : uniq.length ? uniq.slice(0, 12).join(", ") : "ok");
  }

  // External sources must be marked "to verify" (DL-P13 item 2)
  const unmarked = lines.filter((l) => SOURCE_HINT.test(l) && !VERIFY_MARK.test(l));
  add("sources_marked_to_verify", unmarked.length === 0, unmarked.length ? `${unmarked.length} unmarked: ${unmarked[0].trim().slice(0, 90)}` : "ok");

  if (params.pedagogy) pedagogyChecks(text, add);
  if (params.languagePurity && (params.language === "german" || params.language === "english")) {
    // L-3 (specs/language-quality): Bosnian function words inside a German/English plan. Names with č/ć/š/ž/đ
    // (Bašeskija, Ljubović) are fine, so letters are not counted. The Bosnian footer (A14) is excluded.
    const footerStart = text.search(/Za savjete, pitanja|Maj[ai] Ljubovi[cć]/);
    const body = footerStart > 0 ? text.slice(0, footerStart) : text;
    const found = [...body.matchAll(BOSNIAN_FUNCTION_WORDS)].map((m) => m[0]);
    const uniq = [...new Set(found)];
    add("language_purity", uniq.length < 2,
      uniq.length < 2 ? "ok" : `Bosnian words: ${uniq.slice(0, 10).join(", ")} (${found.length}×)`);
  }

  const failed = checks.filter((c) => !c.ok).map((c) => c.id);
  return { passed: checks.length - failed.length, total: checks.length, failed, checks };
}
