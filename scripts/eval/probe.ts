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
await docLines("https://ai.google.dev/gemini-api/docs/rate-limits", /free tier|tokens per day|TPD|2\.5 flash|3\.8 flash|3\.5 flash/i, 40);
await docLines("https://ai.google.dev/gemini-api/docs/pricing", /3\.8 flash|3\.5 flash|2\.5 flash|input price|output price|free of charge|per 1M/i, 40);

// Data use + terms (school data, GDPR): what Google does with free-tier vs paid content.
await docLines("https://ai.google.dev/gemini-api/docs/pricing", /improve our products|used to improve|data/i, 20);
await docLines("https://ai.google.dev/gemini-api/terms", /improve|human review|unpaid|paid services|free|retain|minors|under 18|personal data|confidential/i, 40);
await docLines("https://ai.google.dev/gemini-api/docs/pricing", /gemini 2\.5 flash|\$0\.\d+|\$\d\.\d+/i, 40);
// "probe-docs": read the official pages only, spend no generation quota.
if (Deno.env.get("PROBE_DOCS_ONLY") === "1") Deno.exit(0);

console.log("\n=== Models visible to this key (generateContent-capable, 'flash' or 'pro')");
const list = await (await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: H, signal: AbortSignal.timeout(20_000) })).json();
const models: string[] = (list.models ?? []).filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes("generateContent")).map((m: { name: string }) => m.name.replace("models/", ""));
for (const m of models.filter((n) => /flash|pro/i.test(n))) console.log(" • " + m);

const candidates = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.8-flash"].filter((m) => models.includes(m));
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

// One FULL-SIZE request (PSI v9 draft as system prompt, real lesson) per model:
// shows whether a ~28k-token prompt is accepted on this key, the latency,
// token usage, and the exact quota violation if refused.
const { PSI_V90_PROMPT } = await import("../../supabase/functions/_shared/psi_v90.generated.ts");
console.log("\n=== Full-size request (PSI v9 draft, g08 Fotosinteza 45 min) per model");
for (const m of candidates) {
  const t0 = Date.now();
  let r: Response;
  try {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
      method: "POST", headers: H, signal: AbortSignal.timeout(240_000),
      body: JSON.stringify({
        system_instruction: { parts: [{ text: PSI_V90_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: "MODE B — DIRECT GENERATION.\nsubject: Biologie\ngrade: 5\ntopic: Fotosinteza\nduration_min: 45\ntier: MICRO\noutput_language: Bosnian (bosanski)" }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
      }),
    });
  } catch (e) { console.log(` • ${m}: request failed (${e instanceof Error ? e.name : e})`); continue; }
  const j = await r.json().catch(() => ({}));
  const quota = (j?.error?.details ?? []).flatMap((d: { violations?: { quotaMetric?: string; quotaId?: string; quotaValue?: string }[] }) => d.violations ?? []).map((v: { quotaMetric?: string; quotaId?: string; quotaValue?: string }) => `${v.quotaId ?? ""} limit=${v.quotaValue ?? "?"}`);
  const u = j?.usageMetadata ?? {};
  const text = (j?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  console.log(` • ${m}: HTTP ${r.status} in ${((Date.now() - t0) / 1000).toFixed(1)} s` +
    (r.ok ? ` — prompt ${u.promptTokenCount} tok, output ${u.candidatesTokenCount} tok, thoughts ${u.thoughtsTokenCount ?? 0} tok, ${text.length} chars, finish=${j?.candidates?.[0]?.finishReason}` : ` — ${(j?.error?.message ?? "").slice(0, 300)}`) +
    (quota.length ? `\n     quota: ${quota.join(" ; ")}` : ""));
  if (r.ok) {
    const { validatePlan } = await import("../../supabase/functions/_shared/validate.ts");
    const rep = validatePlan(text, { language: "bosnian", duration_min: 45, tier: "MICRO" });
    console.log(`     validator: ${rep.passed}/${rep.total}; failed: ${rep.failed.join(", ") || "none"}`);
  }
  await new Promise((res) => setTimeout(res, 15000));
}
