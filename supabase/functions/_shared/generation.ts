// Gemini generation settings — ONE place for production (ibl-chat) and the
// golden evaluation (scripts/eval), so they cannot diverge (M-7).
//
// maxOutputTokens counts Gemini 2.5's "thinking" tokens too. With PSI v9 a plan
// is ~8–10k visible tokens plus 4–7k thinking; at 16,384 a Bosnian plan was cut
// off before the footer (eval run 42832805285, finish=MAX_TOKENS: 9,186 + 7,194).
// 2.5 Flash allows up to 65,536; 32,768 leaves room for both.
export const GEMINI_GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 32768,
} as const;

// Model fallback (Director 2026-11-13, "Rezervni model da"; DL-P18). Google counts quotas per project AND
// per model. The key check of 2026-11-13 showed that only 5 of 12 production keys can serve 2.5 Flash
// (newer projects answer 404). 3.5 Flash works on 9 of them, and golden eval scored 6/6, 21/21.
// Each key tries the primary model first, then the fallback model ON THE SAME KEY.
export const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash"] as const;
export type GeminiModel = typeof GEMINI_MODELS[number];

/** What to do after a failed Gemini answer:
 *  next-model = this model is used up or unavailable on this key, try the next model on the same key;
 *  dead-key   = the key itself is unusable (invalid, no free tier, prepaid billing), skip it;
 *  overloaded = Google-side 500/503 for this model, back off and try the next model / key. */
export type GeminiFailure = "next-model" | "dead-key" | "overloaded";
export function classifyGeminiFailure(status: number, body: string): GeminiFailure {
  if (status === 500 || status === 503) return "overloaded";
  if (status === 402 || status === 403 || status === 401) return "dead-key";
  if (status === 400 && body.includes("API_KEY_INVALID")) return "dead-key";
  return "next-model"; // 429 quota, 404 model not available for this project, other 4xx
}
