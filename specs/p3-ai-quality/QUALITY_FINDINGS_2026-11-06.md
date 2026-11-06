# Generated plan quality — Director finding, 2026-11-06

**Input:** the Director's first plan after P1 went live
(Biologie, grade 5, "Fotosinteza", 45 min, Bosnian; exported DOCX
`IBL_Plan_bb73afe8.docx`). Verdict: **"veoma loš kvalitet"**.

**P1 did not cause this.** The PSI prompt in `ibl-chat` is
byte-identical before and after P1 (verified at commit). These are
the pre-existing audit findings (report §D) made visible.

| # | Evidence in the plan | Root cause (repo) | Audit ref | Fix phase |
|---|---|---|---|---|
| 1 | Bosnian plan with English labels: "SECTION 1 - HEADER", "INQUIRY QUESTION (IQ)", "TYPE", "Student Response", Golden Rules in English | The production prompt's output template is written in English; the PSI Module 3.10 translation table is not in production | D.1 | P3 |
| 2 | `Date: 2023-10-27` (invented) | The function never passes today's date; the model guesses | — | P3 |
| 3 | "YouTube kanal: Nauka za djecu", "Biologija 5 – Klett Verlag, str. 34" (unverifiable, likely invented) | The production prompt demands "real, named" YouTube titles and textbook pages; the PSI SoT asks for specific *descriptions* | D.2 | P3 (ODR-6) |
| 4 | Evidence (an explainer video) gives the answer away before students investigate | The PSI rule "evidence must not give away the answer" is missing in production | D.1 | P3 |
| 5 | Socratic Q1 is recall ("koji su sastojci…"); teacher replies "Tako je!", "Odlično!" | IBL Teacher Dictionary ("avoid 'That is the correct answer'") missing in production | D.1 | P3 |
| 6 | All 7 Wiggins-McTighe criteria self-marked "YES" | Self-assessment in the same generation; no independent check | D.1 | P3 (validator) |
| 7 | Bloom level "Sinteza (Synthesis)" | Old taxonomy wording; revised Bloom = Create | — | P3 |
| 8 | No learning objectives, outcomes, success criteria or student reflection | Not in the PSI structure | E | P4 (ODR-7) |
| 9 | ASCII "diagram" box broken (`| BILJKA |` misaligned) | Free-text ASCII; no check | D.1 | P3 |
| 10 | DOCX: every line in Courier New, no headings or tables | `DocxExportButton` writes raw lines | U-10 | P5 |
| 11 | Only 1 learning activity, 2 Socratic questions for 45 min | MICRO tier rule (≤45 min) — by design, but thin | — | P3/P4 review |

Highest-leverage single change: production uses the full PSI v8.0
(the declared SoT) instead of the compressed "v8.1". That addresses
1, 4, 5 and part of 3. Plus: inject today's date, and evidence
"to verify" marking (ODR-6).
