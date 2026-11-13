# SPEC — P4 Pedagogy schema extension

Status: DRAFT, awaiting the Director's approval (DL-P04: an approved phase never authorises the next).
Source: forensic audit 2026-11-06, §E "IBL pedagogical standard" and roadmap line
"P4 Pedagogy schema extension: objectives, outcomes, organisational form, student reflection, success
criteria; the validator enforces outcome→activity→evidence→criterion links". Re-checked against PSI v9 (live since 2026-11-10).

## Already delivered by PSI v9 (P3) — no P4 work
| Audit element | Where now |
|---|---|
| 6 Learning objective | A6 "CILJ UČENJA" |
| 7 Measurable outcomes (Bloom verb, evidence) | A6 "ISHODI UČENJA" I1–I4 |
| 21 Success criteria per outcome | A6 "KRITERIJI USPJEHA" ("Mogu …") |
| 22 Differentiation (incl. language learners, SEN) | A9 |
| 24 Time that adds up | A7 + validator `timeline_matches_duration` |
| Real-life anchor, Tips & Tricks | A12, A13 (Director's additions) |

## Gaps that remain (audit §E), proposed for P4
| # | Element | Today | Proposed change |
|---|---|---|---|
| P4-1 | **Organisational form** (individual / pair / group / whole class) per phase (§E 11) | not explicit; "students discuss" is vague | every phase states the form |
| P4-2 | **Phase table: student does / teacher does / product** (§E 16–18) | partly (Socratic dialogue, delivery recommendations) | one compact table in the delivery section |
| P4-3 | **Student reflection** (§E 20) | only teacher self-evaluation | a short student reflection at the end (2–3 prompts, age-appropriate) |
| P4-4 | **Presentation of findings** (§E 19) | implicit | an explicit sharing step with form and time |
| P4-5 | **Materials checklist** (§E 12) | scattered in evidence and Tips | one "Materijali" list at the top of the delivery section |
| P4-6 | **Alignment check** (audit rule): every outcome I1–I4 → at least one activity → one evidence of learning → one "Mogu …" criterion | not checked | validator check `outcomes_aligned`: each I-number is referenced in the activities and evidence; the count of criteria equals the count of outcomes |
| P4-7 | **Vagueness check** (audit rule): each activity says who, does what, with what, produces what, for how long | not checked | validator check on the phase table (form + minutes + product present in every row) |

P4-1…P4-5 change the PSI text (new amendment A16 + one template module), so they need the **Director's approval of the
wording** (CONSTITUTION rule 1). P4-6/P4-7 are validator checks (code); a failing check shows in the quality badge and "Popravi".

## Open question for the Director (audit ODR, §E)
Does IDSS, the ZfA or the canton prescribe an official **content format** for a "pisana priprema nastavnog časa" (a form or
required headings)? The memorandum (DL-P16) covers the letterhead, not the content. If such a form exists, P4 should follow it.
The ACA does not claim any legal standard without the document.

## Out of scope
Structured JSON output from the model (audit D.3 "render from JSON"): a larger architectural change, better done together
with P5 (editing, section regeneration). Design and colours: P6.

## Acceptance
- PSI amendment A16 approved verbatim by the Director before it goes live (same reading package as PSI v9).
- Golden evaluation: no check below the P3 baseline; new checks `outcomes_aligned` / `phases_complete` pass on ≥ 90% of plans.
- Display, Word export (memorandum) and the validator handle the new sections (tests, including one real plan).
- Non-regression: existing plans still display and export (CONSTITUTION rule 5).

## Decisions needed
1. Approve P4 (all items, or a subset).
2. Answer the official-format question (send the document if one exists).
