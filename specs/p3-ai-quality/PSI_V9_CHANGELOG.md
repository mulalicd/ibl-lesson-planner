# PSI v9.0 DRAFT — change log against v8.0

**Status:** DRAFT for Director approval (DL-P13, CONSTITUTION rule 1).
Production keeps the current prompt until (1) the Director approves
this text and (2) the golden evaluation shows v9.0 ≥ v8.0 and ≥ today.

**File:** `IDSS_IBL_PSI_v9_draft.md`. It is v8.0 unchanged, plus the
items below. The methodology, protocols, modules and IDSS template of
v8.0 are **kept**.

| # | Change | Where | Why (evidence) |
|---|---|---|---|
| 1 | Title / version → v9.0 DRAFT | header | versioning |
| 2 | **Binding amendments A1–A11**: take precedence over modules | before "SYSTEM EXECUTION" | one visible, reviewable layer of changes |
| 3 | A1 — whole plan in the chosen language; correct č ć š ž đ / ä ö ü ß; no English labels in bs/de | amendment | Director's plan: English headings, "DOKAZ UCENJA" (validator: no_english_labels, bosnian_diacritics) |
| 4 | A2 — no invented titles, channels, pages, URLs, statistics; any named source marked ZA PROVJERU; date and teacher left blank | amendment | invented "Nauka za djecu", "Klett str. 34", date 2023-10-27 (DL-P13 item 2) |
| 5 | A3 — evidence creates tension and never gives the answer; explanation only after exploration (5E) | amendment | the explainer video gave the answer away |
| 6 | A4 — Teacher Dictionary binding; no "Tačno / Tako je / Bravo"; three anticipated answers (shallow / misconception / off-track) with facilitative replies | amendment | the dialogue validated answers ("Tako je!") |
| 7 | A5 — no recall questions; varied Paul & Elder types; last = synthesis | amendment | Q1 was recall ("koji su sastojci") |
| 8 | **A6 — ISHODI UČENJA: a goal + 3–4 detailed, measurable outcomes (verb, content, condition, evidence, Bloom level) + matching "Mogu…" success criteria** | amendment | Director 2026-11-07: "jasno i detaljno razrađeni ishodi učenja" (approved) |
| 9 | A7 — explicit minutes and an "Ukupno: N min" line that equals the duration; revised Bloom names | amendment | timing not verifiable; "Sinteza (Synthesis)" = old taxonomy |
| 10 | A8 — ASCII only if aligned and ≤ 60 chars, else a drawing instruction | amendment | broken box in the Director's plan |
| 11 | A9 — differentiation always covers the language learner (DaZ/BHS/EAL), SEN, extension | amendment | German school, multilingual classes |
| 12 | A10 — quality check printed as short reasons, never bare "YES" lists | amendment | 7× "YES" self-assessment |
| 13 | A11 — never truncate; footer always last | amendment | completeness |
| 13a | **A12 — UPORIŠTE U STVARNOM ŽIVOTU: 2–3 concrete real-life situations (home, Sarajevo/BiH, nature, sport, technology, jobs), used in hook/evidence/transfer** | amendment | Director 2026-11-07 |
| 13b | **A13 — SAVJETI I TRIKOVI ZA NASTAVNIKE: the closing section, 6–8 expert topic-specific ideas (preparation / delivery / after)** | amendment | Director 2026-11-07 |
| 13c | A14 — the footer stays Bosnian in every language | amendment | Director decision (b) |
| 14 | Module 3.10 table rewritten with correct spelling + new labels (Cilj učenja, Kriteriji uspjeha, Ukupno, Česte zablude …) | 3.10 | A1/A6/A7 need the labels |
| 15 | Footer: correct spelling, PSI v9.0, contact maja.ljubovic@idss.ba | 3.12 | DL-P10 |

**Director decisions (2026-11-07):**
- (a) outcomes accepted in v9.0, expanded to detailed outcomes
- (b) the footer stays Bosnian
- (c) shorten the prompt ONLY if measurement shows no quality loss;
  quality comes first ("ova web app je korisna onoliko koliko je
  kvalitetan AI odgovor")

## 2026-11-07 — evidence-driven fixes (eval runs 42354465883, 42356033884)
- **Orthography of the Protocol 3 templates (A1 enforcement):** the
  output templates inherited from v8.0 were written in ASCII Bosnian
  ("ISTRAZIVACKO PITANJE", "Skola", "CASA", "STA MOZETE…"). Gemini 2.5
  Flash copies templates verbatim and failed `bosnian_diacritics` 0/2
  despite rule A1. The template lines of Modules 3.1–3.13 (two correction passes) are now spelled
  with č ć š ž đ. The wording and structure are unchanged: only
  diacritics, plus 2 Cyrillic look-alike letters replaced ("Sluzи",
  "uceniсka").
- **A15 — order of the closing elements:** Module 3.13 said "the very
  last element before any footer", which contradicted A13 (Tips is the
  last section before the footer). The fixed order is now: … Tips &
  Tricks → footer → "ŠTA MOŽETE URADITI SLJEDEĆE" block (an app hint,
  not part of the plan). This is what the model already produced.
- Validator: the next-steps block after the footer is no longer flagged
  as truncation (max 4,000 chars after the footer). German total lines
  "Insgesamt / Gesamtdauer / Summe" are recognised.
- Still a DRAFT: needs the Director's approval before production
  (CONSTITUTION rule 1).
