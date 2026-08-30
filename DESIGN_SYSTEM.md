# DESIGN_SYSTEM.md — IBL Lesson Planner
# Milky-White 3D Neumorphic — IDSS Brand

Source of truth for token *names and intent*. Actual values live as
CSS custom properties in `src/index.css` `:root` and are exposed as
Tailwind utilities via `tailwind.config.ts` (E-11: no hardcoded
hex/pixel values in component files — consume tokens, don't
duplicate values).

## Brand Colours (approved palette)

| Token | Hex | Tailwind | Role |
|---|---|---|---|
| `--idss-gold` (also `--primary`) | `#FFCB29` | `text-idss-gold`, `bg-primary` | **Dominant accent.** Primary actions, CTAs, favourites. |
| `--idss-dark-blue` (also `--secondary`) | `#035EA1` | `text-idss-dark-blue`, `bg-secondary` | **Structure.** Navigation, headings, strong hierarchy. |
| `--idss-bright-blue` (also `--accent-foreground`) | `#08ABE6` | `text-idss-bright-blue`, `bg-accent` | **Interaction / information.** Links, badges, secondary interactive elements. |
| `--idss-red` (also `--destructive`) | `#E8262C` | `text-idss-red`, `bg-destructive` | **Special/rare accent.** Warnings, destructive actions only — never decorative. |
| — (`--foreground`) | near-black | `text-foreground` | Max-contrast text/icons. |

**Priority (brief §10):** yellow dominant → blue structure → bright
blue interaction → red rare. Don't use all four with equal weight on
one screen.

## Surfaces

- `--background` — milky-white page background (warm-neutral, not
  sterile pure white)
- `--card` — pure white, for the "raised" neumorphic surface effect
  against the warmer background

## Depth (brief §13)

| Token | Tailwind | Use |
|---|---|---|
| `--depth-1` | `shadow-depth-1` | subtle |
| `--depth-2` | `shadow-depth-2` | light — default `.neu-btn` |
| `--depth-3` | `shadow-depth-3` | moderate — `.neu-btn` hover |
| `--depth-4` | `shadow-depth-4` | **deep premium — project default**, `.neu-card` |
| `--depth-5` | `shadow-depth-5` | maximum — `.neu-card` hover |

Built from the existing `--neu-light` / `--neu-dark` (and inset
variants) tokens — unchanged, just given named steps.

## Radius (brief §15)

| Token | Value | Tailwind |
|---|---|---|
| `--radius-sm` | 8px | `rounded-sm` |
| `--radius-md` | 12px | `rounded-md` |
| `--radius` / `--radius-lg` | 16px (**project default**) | `rounded-lg` |
| `--radius-xl` | 20px | `rounded-xl` |

## Typography (brief §14)

`Plus Jakarta Sans` — already the project's font (`--font-sans`), no
change needed. `Inter` and `IBM Plex Mono` remain available as
fallback/mono where already used.

## Existing neumorphic utility classes (unchanged, now token-backed)

`.neu-card`, `.neu-inset`, `.neu-btn`, `.neu-btn-primary` — all
pre-existing in this codebase, now reference the named depth tokens
above instead of duplicated literal shadow values. Behaviour and
rendered output are unchanged; only the source of the values changed
(M-11: refactor, not behaviour change).

## Status colours (separate from brand identity)

| Token | Role |
|---|---|
| `--status-success` / `--status-success-bg` | "Saved/done" confirmation states — universal UI convention, deliberately kept out of the 5-colour brand palette rather than reusing e.g. bright blue for a meaning it doesn't carry. |

## Rule

**Never hardcode a hex colour, shadow value, or radius pixel value
inside a component file.** Use a Tailwind class backed by a token
above, or add a new token here + in `src/index.css` first if
something is genuinely missing (E-11).
