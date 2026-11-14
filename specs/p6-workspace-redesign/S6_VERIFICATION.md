# P6 S6 — Verification and release (Director: "s6", 2026-11-14)

Evidence for the acceptance criteria of `SPEC.md`. Measured by the ACA unless marked **Director**.

## Contrast (WCAG 2.x AA) — measured on the rendered screens
Method: every visible text node on each screen; foreground colour against the real background (ancestor
backgrounds blended, element opacity applied); threshold 4.5:1, or 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold);
disabled controls excluded (WCAG exception).
Screens (desktop 1440 px and phone 390 px): sign-in; creation form steps 1–5; plan being written / written (cards);
library; saved plan (document); "Razgovor s AI-om" on a saved plan.

| Run | Failures |
|---|---|
| First run | 3 — "—" placeholder (2.52), conversation footer (4.35), "PSI v9.1" on the plan page (1.89) |
| After fixes (neutral-600 text) | **0** on all 20 screens |

## Performance (E-15) — before/after, 5 interleaved runs, median
Method: production build served locally (`vite preview`), Chromium, phone viewport, CPU 4× slower,
network 150 ms latency / 1.6 Mbit/s; runs alternate before/after so drift affects both.

| Page | FCP before → after | LCP before → after | JavaScript downloaded |
|---|---|---|---|
| Sign-in | 2072 → 1532 ms | 2072 → 1532 ms | 771 → 528 kB |
| Library | 2060 → 1680 ms | 2188 → 1860 ms | 771 → 660 kB |
| Saved plan | 2040 → 1708 ms | 2660 → 2452 ms | 771 → 710 kB |

Changes: pages load on demand (`React.lazy`); React and Supabase in their own files (cached across releases);
index.html asks for the opened page's files at once (`preloadOpenedPage` in `vite.config.ts`) so there is no
second round trip. A first attempt that also split the animation library made it load on every page and was
removed (the measurement caught it).

## Browsers
| Browser | Status |
|---|---|
| Chromium (Chrome, Edge engine) | ACA: every changed screen at 1920/1440/1024/768/390 px, console 0 errors (S1–S6) |
| Firefox, Safari/WebKit | Not available here: the download of Playwright's Firefox/WebKit is not permitted in this cloud session. **Director**: check on own devices (list in the release message). |
| Safari iOS, Chrome Android | **Director**: real devices. |

## Functional non-regression
vitest 133/133; Playwright smoke 3/3 on the production build; Deno check, Deno tests 43/43 and the Edge Function
e2e 13/13 (CI steps, also run locally); every page opened on the production build with console 0 errors.
