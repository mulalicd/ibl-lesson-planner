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
