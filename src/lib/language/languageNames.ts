// The name of each output language as the AI instructions write it (English, like every PSI instruction).
// One source (M-7) for the Edge Function prompt (supabase/functions/_shared/prompt.ts) and the browser's
// section revision (src/lib/sectionRevision.ts). No imports, so both Vite and Deno can load this file.
export const AI_LANGUAGE_NAMES = { bosnian: "Bosnian (bosanski)", german: "German (Deutsch)", english: "English" } as const;
