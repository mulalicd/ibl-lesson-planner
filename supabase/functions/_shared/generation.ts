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
