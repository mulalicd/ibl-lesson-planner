# DESIGN_SYSTEM.md — IBL Lesson Planner
# "Nastavnički radni sto" (direction C, P6 — DL-P33…DL-P37)

Replaces the superseded Milky-White Neumorphic description (DL-P03). Source of truth for token *names and intent*;
the values live as CSS custom properties in `src/index.css` (`:root`) and are exposed through `tailwind.config.ts`.
Components use tokens or Tailwind classes, never their own colour values (E-11). The CI step "Only IDSS colours"
(`scripts/check-colours.mjs`) fails the build on any other colour.

## 1. Idea
The app is a teacher's desk: a neutral grey surface (`--background`) on which plans lie as sheets of white paper
(`--card`) with binder tabs in the five IDSS colours. Depth comes from paper shadows and small 3D tilts, never from
colour gradients.

## 2. Colours (CONSTITUTION rule 6, amended DL-P33)
Only the five IDSS colours, white and neutral greys (R = G = B), each with any transparency.

| Token | Value | Use | Text on it |
|---|---|---|---|
| `--brand-blue` / `--primary` | `#035EA1` | primary actions, active navigation, links, "Nastavnik" | white (6.73:1) |
| `--brand-yellow` / `--secondary` | `#FFCB29` | "Učenik", quality check, minutes, highlights | black (13.8:1) |
| `--brand-lightblue` / `--ring` | `#08ABE6` | "N·U", focus ring, decoration | black only |
| `--brand-red` / `--destructive` | `#E8262C` | warnings, delete, markers | black (5.0:1); **never small red text on white** (4.43:1) |
| `--brand-black` / `--foreground` | `#000000` | text, "Sve", dark tabs | white |
| `--background` | neutral 96 % | the desk | — |
| `--card` | white | the paper | — |
| `--muted-foreground` | `#595959` | secondary text | — (7.0:1 on white) |

Rules: text is black, neutral-600 (`#525252`) or darker, or white on blue/black. Yellow and light blue are never
text on white. Measured on every screen in S6: 0 texts below WCAG AA (`specs/p6-workspace-redesign/S6_VERIFICATION.md`).

Audience colours (DL-P34, `src/lib/planSegments.ts`): Nastavnik = blue, Učenik = yellow, N·U (both) = light blue in
marks / black in badges.

## 3. Type (DL-P33, self-hosted, OFL)
- `--font-display` — Manrope Variable: page titles, segment titles, numbers (800 weight).
- `--font-sans` — Inter Variable: everything else.
- `--font-mono` — system monospace, only for ASCII drawings of a plan.
Loaded in `src/main.tsx` from `@fontsource-variable/*` (no requests to Google).

## 4. Surfaces and depth
- **Sheet** (paper): white, `rounded-md`/`rounded-lg`, shadow `0 1px 0 rgb(221 221 221), 0 18–24px 40–48px rgba(0,0,0,.12–.14)`;
  pages "under" it are offset, slightly rotated white layers.
- **Binder tabs**: IDSS colours, vertical at the right edge of a sheet on wide layouts, along the top on narrow ones.
- **Five-colour edge**: a 6 px strip of the five colours on top of the creation block.
- **3D cards** in the conversation: a small `rotateY/rotateX` on hover, a coloured edge (blue for the AI, yellow
  "Vi" badge for the teacher).
- The legacy `.neu-*` class names are kept and draw the desk style (`src/index.css`).

## 5. Layout
- Full width on tablet and computer; the header has the IDSS logo (left), "IBL Planer" (centre on ≥ 640 px), the
  navigation Planer / Planovi / Uputstvo and sign-out (right).
- Planner: conversation zone (320–380 px) on the left, creation block and plan in the centre (phone: one column).
- Plan workspace (`PlanDisplay`): chooses its layout from its own width (table of contents beside the page from
  960 px); cards while a plan is created, one continuous document for a saved plan (`asDocument`).

## 6. Motion (E-12)
Entrance and state changes move (short slide/tilt, 0.3–0.5 s), never fade from invisible; all motion is off under
"reduce motion". Pages keep a minimum height and the scrollbar space is reserved, so screens do not jump.

## 7. Rendering plan text (`src/lib/planDocxStructure.ts`, one renderer for screen and Word)
Headings, paragraphs, checkboxes, bullets, numbered labels (I1, K2), real tables from PSI boxes, from
"a | b | c" rows with "----|----" separators and from space-aligned columns; drawings in monospace without the
plan's outer box; Markdown leftovers removed; " — " shown as ", " (`src/lib/language/display.ts`).

## 8. Word export
Every export (plan, conversation) is on the official IDSS memorandum (`src/lib/memorandumDocx.ts`), IDSS blue
headings, real tables.
