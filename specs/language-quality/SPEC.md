# SPEC — Language quality in every output language (DL-P19 follow-up)

Status: DRAFT, awaiting the Director's approval.
Source: Director, 2026-11-13: "Svi prikazani sadržaji moraju biti strogo na jeziku koji je korisnik izabrao …
njemački → vrhunski njemački, engleski → vrhunski engleski, bosanski → vrhunski bosanski (latinica, bez
srbizama i kroatizama). Pojedinim riječima nedostaju slova. Kontrolni sloj prije ispisa, bez usporavanja."

## Already live (PR #20, #21)
- Bosnian: grammar-safe automatic fixes while the plan streams (točno→tačno, deca→djeca …).
- Bosnian: the `bosnian_standard` check ("Bosanski jezik") names Croatisms that need a rewrite
  (rajčica, tjedan, kruh, tvornica …), and "Popravi" sends exactly those words.
- Cyrillic text fails the check.
- All checks run after the last token, in milliseconds. There is no extra AI call.

## Gaps
| # | Gap | Proposed change | Cost / risk |
|---|---|---|---|
| L-1 | **Prevention at the source.** The model is never told the Bosnian standard explicitly. | PSI amendment **A17 "Jezik"**: standard Bosnian, Latin script, ijekavian; a short list of forbidden forms with their standard words (the same list as the code). German: Standarddeutsch, Hochsprache. English: one variety, consistently. | PSI text, so it needs the Director's approval of the wording. Zero latency. |
| L-2 | **Missing letters / misspellings** ("u pojedinim riječima nedostaju slova"). The cause is unknown. | Step 1: one real example from the Director (a screenshot of the word) to separate a model typo from a display or stream defect. Step 2: a dictionary spell check (Hunspell dictionaries, `nspell`), loaded in the browser only after the plan is complete. Unknown words are flagged in the badge, never changed automatically. | A new dependency plus dictionaries (about 1–3 MB per language, loaded only on demand). Licences must be checked per dictionary. [U] A Bosnian Hunspell dictionary of usable quality is not yet verified. |
| L-3 | **German and English purity.** Bosnian words inside a German or English plan; the only allowed exception is the Bosnian signature (A14). | Validator check `language_purity`: lines with č/ć/š/ž/đ outside the signature block; for German, English section headings (already covered by `no_english_labels`). | Code only; a new badge label needs the Director's wording. |
| L-4 | **Measurement.** | The golden evaluation reports language hits per plan (the same functions). Target: 0 hits on all 24 lessons before L-1 goes live. | Code only. |

## Out of scope
- A second AI "proofreading" pass: it would double the wait and the quota use.
- Automatic rewriting of words that change grammar (e.g. rajčica→paradajz): it breaks sentences. "Popravi"
  rewrites them.

## Acceptance
- 0 `bosnian_standard` hits on the 24 golden lessons with A17 live.
- Spell check: no false alarm on the 3 approved reference plans (Director's reading). Every real typo in them
  is found.
- No added wait: the plan text is visible as soon as the last token arrives; checks finish within 200 ms.

## Decisions needed
1. Approve L-1 … L-4, or a subset.
2. Send one example of a word with missing letters (a screenshot).

## L-1 — Draft wording of PSI amendment A17 (for the Director's approval; not live)
```
A17 — LANGUAGE OF THE OUTPUT (Director 2026-11-13, DL-P19)
  Every word of the plan, including headings, tables, examples, student prompts and the teacher's
  sentences, is written ONLY in output_language, at the level of an excellent native writer.
  The only exception is the Bosnian signature (A14).
  - bosnian: standard Bosnian, Latin script, ijekavian, never Croatian or Serbian forms.
    Use: paradajz, sedmica, hljeb, fabrika, historija, nauka, porodica, pozorište, muzika, fudbal, voz,
    univerzitet, tačno, tačka, općina, uopće; months januar … decembar.
    Never: rajčica, tjedan, kruh, tvornica, povijest, znanost, obitelj, kazalište, glazba, nogomet,
    vlak, sveučilište, točno, točka, opština, uopšte, istorija, siječanj … prosinac, ekavian forms
    (deca, vreme, gde, reka).
  - german: Standarddeutsch (Hochsprache), correct capitalisation and ß/umlauts; no Bosnian or English
    words except names and quoted sources.
  - english: one variety throughout (British spelling), no Bosnian or German words except names and
    quoted sources.
  - Before printing, check every word for missing or swapped letters.
```
The list mirrors `src/lib/language/bosnianStandard.ts`, so the code and the prompt name the same words.
