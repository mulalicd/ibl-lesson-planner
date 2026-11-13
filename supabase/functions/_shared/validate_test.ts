// deno test --allow-read supabase/functions/_shared/validate_test.ts
import { validatePlan } from "./validate.ts";

const fixture = await Deno.readTextFile(new URL("./fixtures/plan_v81_fotosinteza_bs.txt", import.meta.url));

function failed(text: string, p = { language: "bosnian" as const, duration_min: 45 }): string[] {
  return validatePlan(text, p).failed;
}

Deno.test("Director's real v8.1 plan: the known defects are detected (and only real ones)", () => {
  const r = validatePlan(fixture, { language: "bosnian", duration_min: 45, tier: "MICRO" });
  const f = new Set(r.failed);
  for (const must of ["no_english_labels", "no_invented_date", "sources_marked_to_verify", "footer_contact"]) {
    if (!f.has(must)) throw new Error(`expected failure ${must}; got ${[...f]}`);
  }
  for (const must2 of ["section_outcomes", "section_realLife", "section_tips"]) {
    if (!f.has(must2)) throw new Error(`v8.1 plan has no ${must2}; expected failure`);
  }
  for (const ok of ["section_iq", "section_hook", "iq_is_a_question", "timeline_matches_duration", "socratic_synthesis_present"]) {
    if (f.has(ok)) throw new Error(`unexpected failure ${ok}: ${JSON.stringify(r.checks.find((c) => c.id === ok))}`);
  }
});

const GOOD_BS = `
================================================================================
PLANER ZA IBL LEKCIJU
================================================================================
Škola: Internationale Deutsche Schule Sarajevo
| Predmet i razred: Biologie, 5. razred |
| Datum:            _______________   Trajanje: 45 min |
UDICA
"Pogledajte ovu biljku."
ISTRAŽIVAČKO PITANJE (mora biti otvoreno)
Kako biljka koja ne jede može rasti i davati nam hranu?
ISHODI UČENJA
I1 Učenik može uporediti …
UPORIŠTE U STVARNOM ŽIVOTU
Bašta u dvorištu škole …
DOKAZNI MATERIJAL
- Kratak animirani isječak o fotosintezi (ZA PROVJERU: YouTube, nastavnik provjerava prije časa)
SKELA — VAŠA ULOGA
|  F  | Sinteza i povratak na istraživačko pitanje |
DOKAZ UČENJA (ne test!)
SAMOEVALUACIJA NASTAVNIKA
DIFERENCIJACIJA
PREPORUKE ZA IZVOĐENJE ČASA
| Ukupno: 45 min |
SAVJETI I TRIKOVI ZA NASTAVNIKE
PRIPREMA: …
Za savjete, pitanja i ideje budite slobodni da se obratite gospođi Maji Ljubović na: maja.ljubovic@idss.ba
`;

Deno.test("a clean PSI-style Bosnian plan passes every check", () => {
  const r = validatePlan(GOOD_BS, { language: "bosnian", duration_min: 45 });
  if (r.failed.length) throw new Error(JSON.stringify(r.checks.filter((c) => !c.ok)));
});

Deno.test("timeline total that does not match the duration fails", () => {
  if (!failed(GOOD_BS.replace("Ukupno: 45 min", "Ukupno: 50 min")).includes("timeline_matches_duration")) throw new Error("not caught");
});

Deno.test("ASCII-folded Bosnian headings fail the diacritics check", () => {
  if (!failed(GOOD_BS.replace("ISTRAŽIVAČKO PITANJE", "ISTRAZIVACKO PITANJE")).includes("bosnian_diacritics")) throw new Error("not caught");
});

Deno.test("an unmarked named source fails", () => {
  if (!failed(GOOD_BS + "\n- Video na YouTube kanalu Nauka za djecu\n").includes("sources_marked_to_verify")) throw new Error("not caught");
});

Deno.test("an invented date fails", () => {
  if (!failed(GOOD_BS.replace("_______________", "2023-10-27")).includes("no_invented_date")) throw new Error("not caught");
});

Deno.test("a truncated plan (no footer) fails footer + truncation", () => {
  const f = failed(GOOD_BS.slice(0, GOOD_BS.indexOf("Za savjete")));
  if (!f.includes("footer_contact") || !f.includes("not_truncated")) throw new Error(f.join());
});

Deno.test("a plan without any timeline fails (never passes by default)", () => {
  if (!failed(GOOD_BS.replace("| Ukupno: 45 min |", "")).includes("timeline_matches_duration")) throw new Error("not caught");
});

Deno.test("missing Tips & Tricks / outcomes / real-life sections fail", () => {
  const f = failed(GOOD_BS.replace("SAVJETI I TRIKOVI ZA NASTAVNIKE", "").replace("ISHODI UČENJA", "").replace("UPORIŠTE U STVARNOM ŽIVOTU", ""));
  for (const id of ["section_tips", "section_outcomes", "section_realLife", "tips_before_footer"]) if (!f.includes(id)) throw new Error(id);
});

const NEXT_STEPS = `
================================================================================
ŠTA MOŽETE URADITI SLJEDEĆE
================================================================================
|  Ovaj plan je spreman za korištenje. Možete:                                 |
|  1. PREUZETI KAO .DOCX                                                       |
|  2. POSTAVLJATI PITANJA O PLANU                                              |
|     - "Kako da produbim istraživačko pitanje za napredne učenike?"          |
|  3. KREIRATI NOVI PLAN                                                       |
================================================================================
`;

Deno.test("the PSI 3.13 next-steps block after the footer is not truncation (A15)", () => {
  const f = failed(GOOD_BS + NEXT_STEPS);
  if (f.length) throw new Error(f.join());
});

Deno.test("a long lesson section after the footer still fails not_truncated", () => {
  if (!failed(GOOD_BS + "\nDIFERENCIJACIJA\n" + "x".repeat(5000)).includes("not_truncated")) throw new Error("not caught");
});

Deno.test("German total line 'Insgesamt: 45 Minuten' is recognised", () => {
  const de = GOOD_BS.replace("| Ukupno: 45 min |", "| Insgesamt: 45 Minuten |");
  if (failed(de).includes("timeline_matches_duration")) throw new Error("Insgesamt not recognised");
});

Deno.test("a boxed total line padded with many spaces is recognised (Director's 17/19)", () => {
  const padded = GOOD_BS.replace("| Ukupno: 45 min |", "|  Total:                               45 min                                |");
  if (failed(padded).includes("timeline_matches_duration")) throw new Error("padded Total not recognised");
});

Deno.test("a generic mention of a textbook is not an unmarked source; a page reference still is", () => {
  if (failed(GOOD_BS + "\n| what a factual textbook might miss, AND |\n").includes("sources_marked_to_verify")) throw new Error("generic word flagged");
  if (failed(GOOD_BS + "\n- Udžbenik Priroda 5, str. 34\n").includes("sources_marked_to_verify") === false) throw new Error("page reference not flagged");
});

// P4 (PSI v9.1, A16) — lesson flow checks
const GOOD_V91 = GOOD_BS.replace("I1 Učenik može uporediti …", `I1 Učenik može uporediti dva izvora.
I2 Učenik može objasniti ulogu svjetlosti.
I3 Učenik može procijeniti tvrdnju.
KRITERIJI USPJEHA
[ ] Mogu uporediti dva izvora.
[ ] Mogu objasniti ulogu svjetlosti.
[ ] Mogu procijeniti tvrdnju.`).replace("| Ukupno: 45 min |", `| Ukupno: 45 min |
MATERIJALI ZA ČAS
| [ ] 5 kopija teksta A — po jedna za svaku grupu |
TOK ČASA
| Min   | Faza          | Oblik rada  | Učenici rade        | Nastavnik radi | Produkt / dokaz       |
| 0-5   | Udica         | Frontalno   | posmatraju biljku   | pita           | pitanja               |
| 5-25  | Istraživanje  | Grupa (4)   | upoređuju tekstove  | skela          | tabela — dokaz za I1  |
| 25-35 | Predstavljanje nalaza | Grupa → frontalno | predstavljaju | vodi | mapa — dokaz za I2 |
| 35-45 | Refleksija učenika | Individualno | provjeravaju "Mogu …" | sluša | listić — dokaz za I3 |
REFLEKSIJA UČENIKA (pitanja za učenike)
| 1. Šta sada misliš o istraživačkom pitanju? |`);

Deno.test("v9 plans are NOT judged by the v9.1 rules (pedagogy off by default)", () => {
  const off = validatePlan(GOOD_BS, { language: "bosnian", duration_min: 45 });
  if (off.checks.some((c) => c.id === "phases_complete" || c.id === "outcomes_aligned")) throw new Error("pedagogy checks ran without the flag");
});

Deno.test("a complete v9.1 plan passes every check including the lesson-flow checks", () => {
  const r = validatePlan(GOOD_V91, { language: "bosnian", duration_min: 45, pedagogy: true });
  if (r.failed.length) throw new Error(JSON.stringify(r.checks.filter((c) => !c.ok)));
  for (const id of ["section_materials", "section_flow", "section_presentation", "section_studentReflection", "phases_complete", "outcomes_aligned"]) {
    if (!r.checks.some((c) => c.id === id && c.ok)) throw new Error(`missing or failed: ${id}`);
  }
});

Deno.test("a phase row without the form of work fails phases_complete", () => {
  const f = validatePlan(GOOD_V91.replace("| Grupa (4)   |", "| —           |"), { language: "bosnian", duration_min: 45, pedagogy: true }).failed;
  if (!f.includes("phases_complete")) throw new Error(f.join());
});

Deno.test("an outcome that is never used in the lesson fails outcomes_aligned", () => {
  const f = validatePlan(GOOD_V91.replace("listić — dokaz za I3", "listić"), { language: "bosnian", duration_min: 45, pedagogy: true }).failed;
  if (!f.includes("outcomes_aligned")) throw new Error(f.join());
});

Deno.test("fewer 'Mogu …' criteria than outcomes fails outcomes_aligned", () => {
  const f = validatePlan(GOOD_V91.replace("[ ] Mogu procijeniti tvrdnju.", ""), { language: "bosnian", duration_min: 45, pedagogy: true }).failed;
  if (!f.includes("outcomes_aligned")) throw new Error(f.join());
});
