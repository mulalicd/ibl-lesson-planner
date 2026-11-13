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
import { GEMINI_GENERATION_CONFIG, GEMINI_MODELS } from "../../supabase/functions/_shared/generation.ts";

const VARIANTS: Record<string, { kind: "v81" | "psi"; text?: string; label: string }> = {
  v81: { kind: "v81", label: "production today (compressed v8.1)" },
  v80: { kind: "psi", text: PSI_V80_PROMPT, label: "full PSI v8.0 (IDSS_IBL_PSI_v8_final.md)" },
};
// v90 is registered here when the PSI v9.0 draft exists (DL-P13).
try {
  const mod = await import("../../supabase/functions/_shared/psi_v90.generated.ts");
  VARIANTS.v90 = { kind: "psi", text: (mod as Record<string, string>).PSI_V90_PROMPT, label: "PSI v9.0 draft" };
} catch { /* no v9 yet */ }
try {
  const mod = await import("../../supabase/functions/_shared/psi_v91.generated.ts");
  VARIANTS.v91 = { kind: "psi", text: (mod as Record<string, string>).PSI_V91_PROMPT, label: "PSI v9.1 draft (P4, A16)" };
} catch { /* no v9.1 */ }

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
// Provider: "gemini" (default) or "groq" (DL-P14 evaluation only; OpenAI-compatible API).
const provider = model.startsWith("groq:") ? "groq" : "gemini";
const modelId = provider === "groq" ? model.slice(5) : model;
// "production" = exactly what ibl-chat does (DL-P18): per key the primary model, then the fallback model.
const PRODUCTION_CHAIN = model === "production";
if (provider === "gemini" && !PRODUCTION_CHAIN && !/^gemini-[a-z0-9.\-]+$/.test(modelId)) { console.error(`invalid model ${model}`); Deno.exit(2); }
if (provider === "groq" && !/^[A-Za-z0-9._\-\/]+$/.test(modelId)) { console.error(`invalid model ${model}`); Deno.exit(2); }
const keyName = provider === "groq" ? "GROQ_EVAL_KEY" : "GEMINI_EVAL_KEY";
// Key pool (Director 2026-11-13): the eval key first, then the production keys GEMINI_KEY_1..20 when the
// workflow passes them. Quotas are per Google project and model; each production key is used at most
// PER_KEY_CAP times per run, so teachers keep the rest of that project's daily quota.
// Logs name a key only by its label (eval, prod3), never by its value.
type PoolKey = { label: string; value: string; used: number; exhausted: string; model: string };
const pool: PoolKey[] = [];
const evalKey = (Deno.env.get(keyName) ?? "").trim();
if (evalKey) pool.push({ label: "eval", value: evalKey, used: 0, exhausted: "", model: modelId });
if (provider === "gemini") {
  for (let i = 1; i <= 20; i++) {
    const v = (Deno.env.get(`GEMINI_KEY_${i}`) ?? "").trim();
    if (!v) continue;
    // 2026-11-13 key check: GEMINI_EVAL_KEY was the SAME key as GEMINI_KEY_1, so the "eval" key spent a
    // production quota without the cap. A duplicate is relabelled as the production key (capped).
    const dup = pool.find((k) => k.value === v);
    if (dup) { console.log(`note: ${dup.label} is the same key as prod${i} — capped as prod${i}`); dup.label = `prod${i}`; continue; }
    pool.push({ label: `prod${i}`, value: v, used: 0, exhausted: "", model: modelId });
  }
}
if (PRODUCTION_CHAIN) {
  // one entry per key AND model, key-major, so the order matches production; quotas are per model.
  const base = pool.splice(0);
  for (const k of base) for (const m of GEMINI_MODELS) pool.push({ ...k, label: `${k.label}/${m.replace("gemini-", "")}`, model: m });
}
const PER_KEY_CAP = Math.max(1, Number(arg("per-key-cap", "4")) || 4);
if (pool.length === 0) { console.error(`${keyName} missing (and no GEMINI_KEY_n)`); Deno.exit(2); }
console.log(`key pool: ${pool.map((k) => k.label).join(", ")} (production keys: max ${PER_KEY_CAP} requests each)`);
const key = pool[0].value; // groq:list uses the single eval key
/** Next usable key: not exhausted today; production keys under the per-run cap. */
function pickKey(): PoolKey | undefined {
  return pool.find((k) => !k.exhausted && (k.label === "eval" || k.used < PER_KEY_CAP));
}
// "groq:list" prints the models this Groq key may use (no guessing of model ids, M-4) and exits.
if (provider === "groq" && modelId === "list") {
  const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20_000) });
  const j = await r.json();
  console.log(`Groq models (HTTP ${r.status}):`);
  for (const m of (j.data ?? []) as { id: string; context_window?: number; owned_by?: string; active?: boolean }[]) {
    console.log(` • ${m.id}  ctx=${m.context_window ?? "?"}  by=${m.owned_by ?? "?"}  active=${m.active ?? "?"}`);
  }
  if (!r.ok) console.log(JSON.stringify(j).slice(0, 400));
  Deno.exit(0);
}
// Set when Google reports an exhausted per-DAY quota: retrying is pointless until the reset.
let dailyQuotaHit = "";

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
  const body = provider === "groq"
    ? JSON.stringify({
      model: modelId,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      // closest equivalent of the production Gemini settings (Groq has no topK)
      temperature: GEMINI_GENERATION_CONFIG.temperature, top_p: GEMINI_GENERATION_CONFIG.topP, max_tokens: 16384,
    })
    : JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      // identical to production: the same shared constant
      generationConfig: GEMINI_GENERATION_CONFIG,
    });
  if (dailyQuotaHit) return { ok: false as const, ms: 0, error: `skipped: daily quota exhausted (${dailyQuotaHit})` };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const pk = provider === "groq" ? pool[0] : pickKey();
    if (!pk) {
      dailyQuotaHit = `all ${pool.length} keys exhausted or at the per-key cap`;
      console.warn(`  ${dailyQuotaHit} — stopping`);
      return { ok: false as const, ms: 0, error: dailyQuotaHit };
    }
    pk.used++; // every attempt counts against the project's daily requests (503s most likely too)
    const headers: Record<string, string> = provider === "groq"
      ? { "Content-Type": "application/json", Authorization: `Bearer ${pk.value}` }
      : { "Content-Type": "application/json", "x-goog-api-key": pk.value };
    console.log(`  key ${pk.label} (request ${pk.used})`);
    const url = provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : `https://generativelanguage.googleapis.com/v1beta/models/${pk.model}:generateContent`;
    const wait = lastCall + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const t0 = performance.now();
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers,
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
        pk.exhausted = perDay[1];
        console.warn(`  HTTP 429 key ${pk.label}: daily quota exhausted (${perDay[1]}) — next key`);
        attempt--; // a dead key is not a retry of this plan
        continue;
      }
      if (provider === "groq") console.warn(`  groq ${resp.status} retry-after=${resp.headers.get("retry-after")} ${errText.slice(0, 300)}`);
      console.warn(`  HTTP ${resp.status}, retry ${attempt}`);
      await sleep(20_000 * attempt);
      continue;
    }
    // A key that is invalid (400 API_KEY_INVALID), out of prepaid credit (402) or has no free tier (403)
    // is dead for this run: skip it and try the same plan with the next key.
    if (provider === "gemini" && resp.status === 404) {
      const errText = await resp.text();
      pk.exhausted = `HTTP 404 model not available for this project`;
      console.warn(`  key ${pk.label}: ${pk.exhausted} — next${PRODUCTION_CHAIN ? " model/key" : " key"} (${errText.slice(0, 60)})`);
      attempt--;
      continue;
    }
    if (provider === "gemini" && [400, 402, 403].includes(resp.status)) {
      const errText = await resp.text();
      if (resp.status !== 400 || errText.includes("API_KEY_INVALID")) {
        pk.exhausted = `HTTP ${resp.status} ${errText.match(/"message":\s*"([^"]{0,90})/)?.[1] ?? ""}`;
        // a dead key is dead for every model
        for (const other of pool) if (other.value === pk.value && !other.exhausted) other.exhausted = pk.exhausted;
        console.warn(`  key ${pk.label} unusable: ${pk.exhausted} — next key`);
        attempt--;
        continue;
      }
      return { ok: false as const, ms, error: `HTTP ${resp.status}: ${errText.slice(0, 300)}` };
    }
    const json = await resp.json();
    if (!resp.ok) return { ok: false as const, ms, error: `HTTP ${resp.status}: ${JSON.stringify(json).slice(0, 300)}` };
    if (provider === "groq") {
      const ch = json.choices?.[0];
      const u = json.usage ?? {};
      const finish = ch?.finish_reason === "stop" ? "STOP" : (ch?.finish_reason ?? "?");
      return { ok: true as const, ms, text: ch?.message?.content ?? "", finish, usage: { promptTokenCount: u.prompt_tokens, candidatesTokenCount: u.completion_tokens, totalTokenCount: u.total_tokens } };
    }
    const cand = json.candidates?.[0];
    const text = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    return { ok: true as const, ms, text, finish: cand?.finishReason ?? "?", usage: json.usageMetadata ?? {}, served: pk.model };
  }
  return { ok: false as const, ms: 0, error: "gave up after retries (rate limit/server)" };
}

type Row = { variant: string; id: string; served?: string; ok: boolean; ms: number; finish?: string; usage?: Record<string, number>; error?: string; report?: ValidationReport; chars?: number };
const rows: Row[] = [];
await Deno.mkdir(`${out}/plans`, { recursive: true });

async function writeOutputs(): Promise<string> {
  await Deno.writeTextFile(`${out}/results.json`, JSON.stringify(rows, null, 1));

  // ---- report
  const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const lines: string[] = [`# P3 golden evaluation — ${new Date().toISOString().slice(0, 16)}Z`, "", `Inputs: ${inputs.length} lessons · ${provider} model ${modelId} · production generation settings`, ""];
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
  const served = new Map<string, number>();
  for (const r of rows) if (r.ok && r.served) served.set(r.served, (served.get(r.served) ?? 0) + 1);
  lines.push("", "## Plans served by model", "", ...[...served].map(([m, n]) => `- ${m}: ${n}`));
  lines.push("", "## Keys used (requests this run; label only)", "", ...pool.map((k) => `- ${k.label}: ${k.used}${k.exhausted ? ` — not usable: ${k.exhausted}` : ""}`));
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
    const report = validatePlan(r.text, { language: req.params!.language, duration_min: req.params!.duration_min, tier: req.params!.tier, pedagogy: v === "v91" });
    await Deno.mkdir(`${out}/plans/${v}`, { recursive: true });
    await Deno.writeTextFile(`${out}/plans/${v}/${g.id}.txt`, r.text);
    rows.push({ variant: v, id: g.id, served: "served" in r ? r.served : modelId, ok: true, ms: r.ms, finish: r.finish, usage: r.usage, report, chars: r.text.length });
    await writeOutputs(); // results + report on disk after EVERY plan (survives a job timeout)
    console.log(`   ${report.passed}/${report.total} in ${(r.ms / 1000).toFixed(1)}s, ${r.text.length} chars, finish=${r.finish}`);
    for (const c of report.checks.filter((x) => !x.ok)) console.log(`     ✗ ${c.id}: ${c.detail}`);
    if (report.failed.includes("timeline_matches_duration")) {
      const tl = (r.text as string).split("\n").filter((l: string) => /(ukupno|gesamt|total|\d+\s*[-–]\s*\d+\s*min|\d{1,2}:\d{2})/i.test(l)).slice(0, 25);
      console.log(`     timeline lines:\n${tl.map((l: string) => "       " + l.trim()).join("\n")}`);
    }
    if (report.failed.some((id) => id.startsWith("section_"))) {
      // which headings the model actually wrote (to tell a missing section from a renamed one)
      const heads = (r.text as string).split("\n").map((l: string) => l.replace(/[|=]/g, "").trim())
        .filter((l: string) => l.length > 4 && l.length < 70 && l === l.toUpperCase() && /\p{Lu}{4}/u.test(l));
      console.log(`     headings:\n${heads.slice(0, 60).map((l: string) => "       " + l).join("\n")}`);
    }
    if (report.failed.includes("sources_marked_to_verify")) {
      const d = report.checks.find((c) => c.id === "sources_marked_to_verify")?.detail;
      console.log(`     sources detail: ${d}`);
    }
    console.log(`     usage: ${JSON.stringify(r.usage)}`);
    console.log(`     tail: ${JSON.stringify(r.text.slice(-400))}`);
  }
}

console.log("\n" + await writeOutputs());
