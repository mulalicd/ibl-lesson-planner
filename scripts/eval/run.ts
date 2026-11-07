// Golden evaluation for P3 (Commander E-15: quality claims need stable measurement).
//
// Generates every lesson in eval/golden/inputs.json with each prompt variant,
// using EXACTLY the production message builder and generation settings, then
// scores each plan with validatePlan(). Writes:
//   <out>/results.json   per plan: variant, id, latency, tokens, finish reason, checks
//   <out>/report.md      per variant: pass rates per check, scores, latency, tokens
//   <out>/plans/<variant>/<id>.txt   the generated texts (artifact only, never committed)
//
// Usage (CI: .github/workflows/eval-ai-quality.yml):
//   GEMINI_EVAL_KEY=... deno run --allow-net --allow-read --allow-write --allow-env \
//     --config supabase/functions/deno.json scripts/eval/run.ts --variants v81,v80 --out eval-out
import { buildMessages, type AiMessage } from "../../supabase/functions/_shared/prompt.ts";
import { validatePlan, type ValidationReport } from "../../supabase/functions/_shared/validate.ts";
import { PSI_V80_PROMPT } from "../../supabase/functions/_shared/psi_v80.generated.ts";
import { IblChatRequestSchema } from "../../src/lib/validation/schemas.ts";

const VARIANTS: Record<string, { kind: "v81" | "psi"; text?: string; label: string }> = {
  v81: { kind: "v81", label: "production today (compressed v8.1)" },
  v80: { kind: "psi", text: PSI_V80_PROMPT, label: "full PSI v8.0 (IDSS_IBL_PSI_v8_final.md)" },
};
// v90 is registered here when the PSI v9.0 draft exists (DL-P13).
try {
  const mod = await import("../../supabase/functions/_shared/psi_v90.generated.ts");
  VARIANTS.v90 = { kind: "psi", text: (mod as Record<string, string>).PSI_V90_PROMPT, label: "PSI v9.0 draft" };
} catch { /* no v9 yet */ }

const arg = (name: string, def: string) => {
  const i = Deno.args.indexOf(`--${name}`);
  return i >= 0 ? Deno.args[i + 1] : def;
};
const variants = arg("variants", "v81,v80").split(",").map((v) => v.trim()).filter(Boolean);
const limit = Number(arg("limit", "999"));
const only = arg("only", "");
const out = arg("out", "eval-out");
// Model under test (production today: gemini-2.5-flash). Quotas are per model AND per project.
const model = arg("model", "gemini-2.5-flash");
if (!/^gemini-[a-z0-9.\-]+$/.test(model)) { console.error(`invalid model ${model}`); Deno.exit(2); }
// Set when Google reports an exhausted per-DAY quota: retrying is pointless until the reset.
let dailyQuotaHit = "";
const key = Deno.env.get("GEMINI_EVAL_KEY") ?? "";
if (!key) { console.error("GEMINI_EVAL_KEY missing"); Deno.exit(2); }
for (const v of variants) if (!VARIANTS[v]) { console.error(`unknown variant ${v}`); Deno.exit(2); }

type Golden = { id: string; params: Record<string, unknown> };
let inputs: Golden[] = JSON.parse(await Deno.readTextFile("eval/golden/inputs.json"));
if (only) inputs = inputs.filter((g) => only.split(",").includes(g.id));
inputs = inputs.slice(0, limit);

const MIN_INTERVAL_MS = 7_500; // ≤ 8 requests/min, under the free-tier RPM
let lastCall = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generate(messages: AiMessage[]) {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const contents = messages.filter((m) => m.role !== "system").map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents,
    // identical to production (supabase/functions/ibl-chat/index.ts)
    generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 16384 },
  });
  if (dailyQuotaHit) return { ok: false as const, ms: 0, error: `skipped: daily quota exhausted (${dailyQuotaHit})` };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const wait = lastCall + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const t0 = performance.now();
    let resp: Response;
    try {
      resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
        signal: AbortSignal.timeout(240_000), // one plan may never block the whole run
      });
    } catch (e) {
      console.warn(`  request failed (${e instanceof Error ? e.name : e}), retry ${attempt}`);
      await sleep(10_000 * attempt);
      continue;
    }
    const ms = Math.round(performance.now() - t0);
    if (resp.status === 429 || resp.status >= 500) {
      const errText = await resp.text();
      const perDay = errText.match(/"quotaId":\s*"([^"]*PerDay[^"]*)"/);
      if (resp.status === 429 && perDay) {
        dailyQuotaHit = perDay[1];
        console.warn(`  HTTP 429 daily quota exhausted (${perDay[1]}) — stopping, no retries`);
        return { ok: false as const, ms, error: `daily quota exhausted (${perDay[1]})` };
      }
      console.warn(`  HTTP ${resp.status}, retry ${attempt}`);
      await sleep(20_000 * attempt);
      continue;
    }
    const json = await resp.json();
    if (!resp.ok) return { ok: false as const, ms, error: `HTTP ${resp.status}: ${JSON.stringify(json).slice(0, 300)}` };
    const cand = json.candidates?.[0];
    const text = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    return { ok: true as const, ms, text, finish: cand?.finishReason ?? "?", usage: json.usageMetadata ?? {} };
  }
  return { ok: false as const, ms: 0, error: "gave up after retries (rate limit/server)" };
}

type Row = { variant: string; id: string; ok: boolean; ms: number; finish?: string; usage?: Record<string, number>; error?: string; report?: ValidationReport; chars?: number };
const rows: Row[] = [];
await Deno.mkdir(`${out}/plans`, { recursive: true });

async function writeOutputs(): Promise<string> {
  await Deno.writeTextFile(`${out}/results.json`, JSON.stringify(rows, null, 1));

  // ---- report
  const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const lines: string[] = [`# P3 golden evaluation — ${new Date().toISOString().slice(0, 16)}Z`, "", `Inputs: ${inputs.length} lessons · model ${model} · production generation settings`, ""];
  const allChecks = [...new Set(rows.flatMap((r) => r.report?.checks.map((c) => c.id) ?? []))];
  lines.push("| Variant | Plans OK | Avg score | Fully passing | Median latency | Median prompt tokens | Median output tokens | Not STOP |", "|---|---|---|---|---|---|---|---|");
  for (const v of variants) {
    const rs = rows.filter((r) => r.variant === v);
    const okr = rs.filter((r) => r.ok && r.report);
    const avg = okr.length ? okr.reduce((s, r) => s + r.report!.passed / r.report!.total, 0) / okr.length : 0;
    const full = okr.filter((r) => r.report!.failed.length === 0).length;
    lines.push(`| ${v} — ${VARIANTS[v].label} | ${okr.length}/${rs.length} | ${(avg * 100).toFixed(1)} % | ${full}/${okr.length} | ${(median(okr.map((r) => r.ms)) / 1000).toFixed(1)} s | ${median(okr.map((r) => r.usage?.promptTokenCount ?? 0))} | ${median(okr.map((r) => r.usage?.candidatesTokenCount ?? 0))} | ${okr.filter((r) => r.finish !== "STOP").length} |`);
  }
  lines.push("", "## Pass rate per check", "", `| Check | ${variants.join(" | ")} |`, `|---|${variants.map(() => "---").join("|")}|`);
  for (const c of allChecks) {
    const cells = variants.map((v) => {
      const okr = rows.filter((r) => r.variant === v && r.report);
      const applicable = okr.filter((r) => r.report!.checks.some((x) => x.id === c));
      const pass = applicable.filter((r) => r.report!.checks.find((x) => x.id === c)!.ok).length;
      return applicable.length ? `${pass}/${applicable.length}` : "–";
    });
    lines.push(`| ${c} | ${cells.join(" | ")} |`);
  }
  const errs = rows.filter((r) => !r.ok);
  if (errs.length) lines.push("", "## Errors", "", ...errs.map((e) => `- ${e.variant} ${e.id}: ${e.error}`));
  await Deno.writeTextFile(`${out}/report.md`, lines.join("\n") + "\n");
  return lines.join("\n");

}

for (const g of inputs) {
  const req = IblChatRequestSchema.parse({ mode: "generate", messages: [{ role: "user", content: `${g.params.subject} ${g.params.grade} ${g.params.topic}` }], plan_context: null, params: g.params });
  for (const v of variants) {
    const conf = VARIANTS[v];
    const msgs = buildMessages(req, conf.kind, conf.text);
    console.log(`[${v}] ${g.id} ${req.params!.subject} ${req.params!.grade} "${req.params!.topic}" ${req.params!.duration_min}min`);
    const r = await generate(msgs);
    if (!r.ok) { rows.push({ variant: v, id: g.id, ok: false, ms: r.ms, error: r.error }); console.log(`   ERROR ${r.error}`); await writeOutputs(); continue; }
    const report = validatePlan(r.text, { language: req.params!.language, duration_min: req.params!.duration_min, tier: req.params!.tier });
    await Deno.mkdir(`${out}/plans/${v}`, { recursive: true });
    await Deno.writeTextFile(`${out}/plans/${v}/${g.id}.txt`, r.text);
    rows.push({ variant: v, id: g.id, ok: true, ms: r.ms, finish: r.finish, usage: r.usage, report, chars: r.text.length });
    await writeOutputs(); // results + report on disk after EVERY plan (survives a job timeout)
    console.log(`   ${report.passed}/${report.total} in ${(r.ms / 1000).toFixed(1)}s, ${r.text.length} chars, finish=${r.finish}`);
    for (const c of report.checks.filter((x) => !x.ok)) console.log(`     ✗ ${c.id}: ${c.detail}`);
    console.log(`     usage: ${JSON.stringify(r.usage)}`);
    console.log(`     tail: ${JSON.stringify(r.text.slice(-400))}`);
  }
}

console.log("\n" + await writeOutputs());
