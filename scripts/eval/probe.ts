// Gemini diagnostics (P3): which models this key may use, why requests are
// refused (quota type), and Google's own deprecation notices for 2.5 Flash.
// Read-only; tiny requests (maxOutputTokens 8). Never prints the key.
const key = Deno.env.get("GEMINI_EVAL_KEY") ?? "";
if (!key) { console.error("GEMINI_EVAL_KEY missing"); Deno.exit(2); }
const H = { "x-goog-api-key": key, "Content-Type": "application/json" };

async function docLines(url: string, re: RegExp, max = 40) {
  try {
    const html = await (await fetch(url, { signal: AbortSignal.timeout(20_000) })).text();
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const hits: string[] = [];
    lines.forEach((l, i) => { if (re.test(l)) hits.push(lines.slice(Math.max(0, i - 1), i + 3).join(" | ")); });
    console.log(`\n=== ${url} — ${hits.length} matching passages (first ${max})`);
    for (const h of [...new Set(hits)].slice(0, max)) console.log(" • " + h.slice(0, 400));
  } catch (e) { console.log(`\n=== ${url} — fetch failed: ${e}`); }
}

await docLines("https://ai.google.dev/gemini-api/docs/deprecations", /2\.5[- ]flash|shutdown|replacement/i);
await docLines("https://ai.google.dev/gemini-api/docs/changelog", /2\.5|flash-lite|free tier|deprecat/i, 30);
await docLines("https://ai.google.dev/gemini-api/docs/rate-limits", /free|flash|RPD|RPM|TPM/i, 30);

console.log("\n=== Models visible to this key (generateContent-capable, 'flash' or 'pro')");
const list = await (await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: H, signal: AbortSignal.timeout(20_000) })).json();
const models: string[] = (list.models ?? []).filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes("generateContent")).map((m: { name: string }) => m.name.replace("models/", ""));
for (const m of models.filter((n) => /flash|pro/i.test(n))) console.log(" • " + m);

const candidates = [...new Set(["gemini-2.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest", ...models.filter((n) => /^gemini-[3-9][\d.]*-flash(-lite)?$/.test(n))])].slice(0, 8);
console.log("\n=== Tiny generateContent per candidate (status, quota detail)");
for (const m of candidates) {
  let r: Response;
  try {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
    method: "POST", headers: H, signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with OK" }] }], generationConfig: { maxOutputTokens: 8 } }),
    });
  } catch (e) { console.log(` • ${m}: request failed (${e instanceof Error ? e.name : e})`); continue; }
  const j = await r.json().catch(() => ({}));
  const quota = (j?.error?.details ?? []).flatMap((d: { violations?: { quotaMetric?: string; quotaId?: string; quotaValue?: string }[] }) => d.violations ?? []).map((v: { quotaMetric?: string; quotaId?: string; quotaValue?: string }) => `${v.quotaId ?? ""} ${v.quotaMetric ?? ""} limit=${v.quotaValue ?? "?"}`);
  const retry = (j?.error?.details ?? []).find((d: { retryDelay?: string }) => d.retryDelay)?.retryDelay ?? "";
  console.log(` • ${m}: HTTP ${r.status}${r.ok ? " OK" : ` — ${(j?.error?.message ?? "").slice(0, 220)}`}${quota.length ? `\n     quota: ${quota.join(" ; ")}` : ""}${retry ? ` retry=${retry}` : ""}`);
  await new Promise((res) => setTimeout(res, 4000));
}
