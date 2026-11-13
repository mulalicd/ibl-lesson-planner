// Key health check (Director 2026-11-13): ONE tiny request per key and model, so the Director sees which
// of the production keys actually work. Costs 1 request per key per model (maxOutputTokens 8).
// Prints only key labels (eval, prod1..prod20), never key values.
const models = (Deno.env.get("KEYCHECK_MODELS") ?? "gemini-2.5-flash,gemini-3.5-flash").split(",").map((m) => m.trim()).filter((m) => /^gemini-[a-z0-9.\-]+$/.test(m));
const keys: { label: string; value: string }[] = [];
const ev = (Deno.env.get("GEMINI_EVAL_KEY") ?? "").trim();
if (ev) keys.push({ label: "eval", value: ev });
for (let i = 1; i <= 20; i++) {
  const v = (Deno.env.get(`GEMINI_KEY_${i}`) ?? "").trim();
  if (v) keys.push({ label: `prod${i}`, value: v });
}
// Two labels with the same value mean the same key was entered twice.
const seen = new Map<string, string>();
for (const k of keys) {
  const first = seen.get(k.value);
  if (first) console.log(`! ${k.label} is the SAME key as ${first}`);
  else seen.set(k.value, k.label);
}
function meaning(status: number, body: string): string {
  if (status === 200) return "OK";
  if (status === 429) return `daily/minute quota used up (${body.match(/"quotaId":\s*"([^"]+)"/)?.[1] ?? "?"}${body.match(/"quotaValue":\s*"(\d+)"/) ? `, limit=${body.match(/"quotaValue":\s*"(\d+)"/)![1]}` : ""})`;
  if (status === 400 && body.includes("API_KEY_INVALID")) return "KEY INVALID (deleted, mistyped or revoked)";
  if (status === 402) return "PREPAID CREDITS DEPLETED (this project is set up for billing)";
  if (status === 403) return `NO ACCESS: ${body.match(/"message":\s*"([^"]{0,110})/)?.[1] ?? ""}`;
  if (status === 404) return "model not available for this project";
  if (status >= 500) return "Google overloaded (temporary)";
  return `HTTP ${status}: ${body.slice(0, 120)}`;
}
console.log(`\n=== Key health: ${keys.length} keys × ${models.join(", ")}`);
console.log(`| Key | ${models.join(" | ")} |`);
console.log(`|---|${models.map(() => "---").join("|")}|`);
for (const k of keys) {
  const cells: string[] = [];
  for (const m of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": k.value, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with OK." }] }], generationConfig: { maxOutputTokens: 8, thinkingConfig: { thinkingBudget: 0 } } }),
        signal: AbortSignal.timeout(30_000),
      });
      cells.push(meaning(r.status, await r.text()));
    } catch (e) {
      cells.push(`network (${e instanceof Error ? e.name : e})`);
    }
  }
  console.log(`| ${k.label} | ${cells.join(" | ")} |`);
}
