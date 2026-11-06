# Dependency triage — npm audit, 2026-11-06 (P1 Task 13)

Source: `npm audit --json` on `claude/serene-euler-u97sb6`, after
`npm ci`. GitHub Dependabot reported "51" alerts on `main`; it counts
per advisory and per manifest (`package-lock.json` and `bun.lock`), so
the numbers differ. **No package was upgraded** — upgrades need
separate Director approval (SPEC "Out of Scope").

**Summary:** 30 affected packages: 0 critical, 13 high, 16 moderate,
1 low.

## Ranked by real exposure for this app

| Rank | Package | Sev. | Where it runs | Exposure | Recommendation |
|---|---|---|---|---|---|
| 1 | `zod` 3.25.76 | high | Browser + **Edge Function** (P1) | Memory exhaustion on oversized collections; reachable only by signed-in users | **Mitigated in P1:** 1 MB body cap before parsing, plus array/string `.max()` limits. Upgrading to zod 4 is a MAJOR change → P2 candidate. |
| 2 | `react-router-dom` / `react-router` / `@remix-run/router` | moderate | Browser | Open redirect via crafted paths in `<Link>`/`navigate` | Non-major fix available. P1's login redirect only uses `location.state.from` set by our own guard (internal path). P2: upgrade within 6.x. |
| 3 | `ws`, `form-data` | high | Transitive (supabase-js realtime; build tooling) | Server-side parsers. The browser bundle doesn't open raw sockets with untrusted peers. | P2: refresh the lockfile (non-major fixes available). |
| 4 | `vite`, `postcss`, `nanoid`, `picomatch`, `brace-expansion`, `browserslist`, `source-map-js`, `js-yaml`, `lodash`, `flatted` | high | **Build/dev only** | Dev server / build tool. Not shipped to teachers. Risk only on a developer machine or CI. | P2: one lockfile refresh (`npm audit fix`, non-major) with build + test verification. |
| 5 | `vitest`, `@vitest/mocker`, `typescript-eslint*`, `minimatch`, `@humanfs/node`, `@tailwindcss/typography`, `postcss-selector-parser`, `baseline-browser-mapping`, `@tootallnate/once` | moderate/low | Dev/test only | Not shipped | P2, together with rank 4. Some fixes are MAJOR (`typescript-eslint`, `@tailwindcss/typography`): evaluate separately. |

## Also noted
- Both `package-lock.json` and `bun.lock` are committed. They can drift:
  P1 added `@testing-library/dom` only to `package-lock.json`.
  Director decision: keep one lockfile (recommended: npm). Which one
  Vercel uses depends on its detection [UNK], so check the Vercel
  build log before removing either.
