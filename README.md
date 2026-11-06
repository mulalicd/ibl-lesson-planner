# IBL Planer v2.0 — IDSS Sarajevo

AI-powered IBL (Inquiry-Based Learning) lesson plan creator for
Internationale Deutsche Schule Sarajevo.

## Tech Stack
- Vite + React + TypeScript
- Supabase (database + edge functions)
- Google Gemini 2.5 Flash (AI)
- Tailwind CSS + Framer Motion

## Setup
1. Clone the repository
2. Copy .env.example to .env and fill in your values
3. npm install --legacy-peer-deps
4. npm run dev

## Environment Variables
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

## Sign-in (P1)
Teachers sign in with their `@idss.ba` e-mail (link, no password).
Teachers see only their own plans; the Director (admin) sees all.
Deployment steps: `specs/p1-security-data-integrity/ROLLOUT_DIREKTOR.md`.
Database scripts and tests: `supabase/README.md`.
