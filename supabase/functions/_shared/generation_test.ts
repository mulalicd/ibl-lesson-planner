import { classifyGeminiFailure, GEMINI_MODELS } from "./generation.ts";

function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

Deno.test("primary model stays 2.5 Flash, fallback is 3.5 Flash", () => {
  assertEquals([...GEMINI_MODELS], ["gemini-2.5-flash", "gemini-3.5-flash"]);
});

Deno.test("classifies every failure seen in the 2026-11-13 key check", () => {
  // per-day quota on one model -> the other model on the same key has its own quota
  assertEquals(classifyGeminiFailure(429, '{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}'), "next-model");
  // newer projects: 2.5 Flash not available, 3.5 Flash is
  assertEquals(classifyGeminiFailure(404, "model not found"), "next-model");
  assertEquals(classifyGeminiFailure(400, '{"reason":"API_KEY_INVALID"}'), "dead-key");
  assertEquals(classifyGeminiFailure(402, "Your prepayment credits are depleted"), "dead-key");
  assertEquals(classifyGeminiFailure(403, "The Gemini API free tier is not available for this project"), "dead-key");
  assertEquals(classifyGeminiFailure(503, "high demand"), "overloaded");
  assertEquals(classifyGeminiFailure(500, ""), "overloaded");
  // a 400 that is not about the key (e.g. a request the model rejects) may work on the other model
  assertEquals(classifyGeminiFailure(400, "INVALID_ARGUMENT"), "next-model");
});
