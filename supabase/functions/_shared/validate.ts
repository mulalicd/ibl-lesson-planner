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
  delivery: ["PREPORUKE ZA IZVODJENJE", "UNTERRICHTSEMPFEHLUNG", "DELIVERY RECOMMENDATION", "LESSON DELIVERY"],
};

// English template labels that must not appear in a Bosnian or German plan.
const ENGLISH_LABELS = [
  /^\s*SECTION \d+/m, /INQUIRY QUESTION/, /Student Response/i, /Teacher Follow-up/i,
  /\bUSAGE INSTRUCTIONS\b/, /\bSERVES IQ NOTE\b/, /\bIQ COHERENCE NOTE\b/, /\bBLOOM'S LEVEL\b/,
  /\bKEY VOCABULARY\b/, /\bSUPPORT PATH\b/, /\bEXTENSION PATH\b/, /\bBITE YOUR TONGUE\b/,
  /\bRETURN THE BALL\b/, /\bSUPPORT DOUBT\b/, /^\s*School:/m, /^\s*Topic:/m, /^\s*Duration:/m,
];

// Bosnian headings written without diacritics (DL-P13 item 3: correct spelling required).
const ASCII_FOLDED_BS = [/ISTRAZIVACKO PITANJE/, /DOKAZ UCENJA/, /\bSkola:/, /PREPORUKE ZA IZVODJENJE CASA/, /\bZAKLJUCAK\b/, /\bcasa\b/];

const SOURCE_HINT = /(youtube|youtu\.be|https?:\/\/|www\.|\bverlag\b|\bstr\.\s*\d|\bs\.\s*\d|\bseite\s*\d|\bpage\s*\d|\bp\.\s*\d|\bkanal\b|\bchannel\b|\budzbenik\b|\budžbenik\b|\btextbook\b)/i;
const VERIFY_MARK = /(ZA PROVJERU|ZU PR(Ü|UE)FEN|TO VERIFY)/i;

function hasSection(foldedUpper: string, key: string): boolean {
  return SECTIONS[key].some((k) => foldedUpper.includes(k));
}

function timelineCheck(text: string, duration: number): CheckResult {
  const folded = fold(text);
  // 1) explicit total line: "Ukupno: 45 min" / "Gesamt: 45 Min" / "Total: 45 min"
  const total = folded.match(/\b(UKUPNO|GESAMT|TOTAL)\b[^\n\d]{0,30}(\d{1,3})\s*min/i);
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

  // Synthesis / return to the IQ (PSI 2.6/2.10)
  const synth = /(SINTEZ|SYNTHES|RETURN TO (THE )?IQ|POVRATAK NA|RUCKKEHR|RUECKKEHR)/.test(upper);
  add("socratic_synthesis_present", synth, synth ? "present" : "missing");

  // Timeline
  checks.push(timelineCheck(text, params.duration_min));

  // Footer contact (DL-P10) and truncation (footer must be near the end)
  const footerIdx = text.lastIndexOf("maja.ljubovic@idss.ba");
  add("footer_contact", footerIdx >= 0, footerIdx >= 0 ? "present" : "missing or old address");
  // Truncation: the footer block (any address) must be at the very end.
  const footerMarker = Math.max(...[/Maj[ai] Ljubovi[cć]/gi].flatMap((re) => [...text.matchAll(re)].map((m) => m.index ?? -1)), -1);
  add("not_truncated", footerMarker >= 0 && text.length - footerMarker < 1500, footerMarker >= 0 ? "footer at end" : "no footer → likely truncated");

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
  }

  // External sources must be marked "to verify" (DL-P13 item 2)
  const unmarked = lines.filter((l) => SOURCE_HINT.test(l) && !VERIFY_MARK.test(l));
  add("sources_marked_to_verify", unmarked.length === 0, unmarked.length ? `${unmarked.length} unmarked: ${unmarked[0].trim().slice(0, 90)}` : "ok");

  const failed = checks.filter((c) => !c.ok).map((c) => c.id);
  return { passed: checks.length - failed.length, total: checks.length, failed, checks };
}
