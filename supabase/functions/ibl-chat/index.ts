// supabase/functions/ibl-chat — AI lesson-plan generation (Gemini, streamed SSE)
//
// P1 (2026-11-06, Commander E-6): authenticate -> authorise (AI quota)
// -> validate (Zod, shared with the browser) -> execute -> return.
// Generation logic, the PSI prompt and the stream format are UNCHANGED
// from the pre-P1 version (prompt/AI changes are P3). Stream decoding fixed in P3 (_shared/sse.ts).
//
// Required Edge Function secrets: GEMINI_KEY_1..GEMINI_KEY_20 (at least one),
// ALLOWED_ORIGINS (comma-separated, e.g. https://ibl-lesson-planner.vercel.app).
// Provided by the Supabase platform: SUPABASE_URL, SUPABASE_ANON_KEY
// (optional fallback secret: PUBLISHABLE_KEY).

import { createClient } from "@supabase/supabase-js";
import { IblChatRequestSchema } from "../../../src/lib/validation/schemas.ts";
import { createGeminiToOpenAiTransform } from "../_shared/sse.ts";
import { buildProductionMessages } from "../_shared/prompt.ts";
import { PSI_V81_PROMPT } from "../_shared/psi_v81.ts";
import { validatePlan } from "../_shared/validate.ts";

// ─── CORS (allow-list, never "*") ────────────────────────────────────────────
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

// ─── Uniform public errors (E-4 / E-5): user-facing text + machine code ─────
const PUBLIC_ERRORS = {
  UNAUTHORIZED: { status: 401, message: "Sesija je istekla. Molimo prijavite se ponovo." },
  FORBIDDEN_ORIGIN: { status: 403, message: "Pristup nije dozvoljen." },
  INVALID_INPUT: { status: 400, message: "Zahtjev nije ispravan. Provjerite unesene podatke." },
  AI_QUOTA_EXCEEDED: { status: 429, message: "Dostigli ste ograničenje AI zahtjeva. Pokušajte ponovo kasnije." },
  // Wording approved by the Director 2026-11-09 ("tekst greške odobren").
  ALL_KEYS_EXHAUSTED: { status: 429, message: "Google AI je trenutno preopterećen. Pokušajte ponovo za 1–2 minute." },
  INTERNAL: { status: 500, message: "Greška na serveru. Pokušajte ponovo." },
} as const;
type PublicErrorCode = keyof typeof PUBLIC_ERRORS;

function fail(cors: Record<string, string>, code: PublicErrorCode, extra: Record<string, unknown> = {}): Response {
  const e = PUBLIC_ERRORS[code];
  return new Response(
    JSON.stringify({ success: false, error: e.message, code, ...extra }),
    { status: e.status, headers: { ...cors, "Content-Type": "application/json" } },
  );
}

function logError(where: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  console.error(JSON.stringify({ ts: new Date().toISOString(), where, message: e.message, stack: e.stack }));
}

// PSI prompt: supabase/functions/_shared/psi_v81.ts (verbatim, DL-P13).


// ─── GEMINI KEY ROTATION ─────────────────────────────────────────────────────
// Free-tier keys from separate Google projects (DL-P14). Gaps are allowed.
const MAX_GEMINI_KEYS = 20;
// Max total wait across 503 retries in one request (the browser stream stays open meanwhile).
const OVERLOAD_WAIT_BUDGET_MS = 10_000;
const GEMINI_KEYS: string[] = [];
for (let i = 1; i <= MAX_GEMINI_KEYS; i++) {
  const key = Deno.env.get(`GEMINI_KEY_${i}`);
  if (key && key.trim()) GEMINI_KEYS.push(key.trim());
}

function selectKey(requestId: string): number {
  let hash = 0;
  for (let i = 0; i < requestId.length; i++) {
    hash = (hash * 31 + requestId.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % GEMINI_KEYS.length;
}

// ─── GEMINI API CALL ─────────────────────────────────────────────────────────
async function callGemini(
  messages: { role: string; content: string }[],
  requestId: string,
  cors: Record<string, string>,
  onComplete?: (fullText: string) => string | null,
): Promise<Response> {
  if (GEMINI_KEYS.length === 0) {
    logError("callGemini", "No Gemini API keys configured (GEMINI_KEY_1..20)");
    return fail(cors, "INTERNAL");
  }

  const startIndex = selectKey(requestId);
  const systemInstruction = messages.find(m => m.role === "system")?.content || PSI_V81_PROMPT;
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // P3 reliability (2026-11-09): "503 model overloaded" is Google-side for the whole
  // model, so every key fails at the same moment. Rotating instantly burned all
  // 12 keys in ~1 s. Now: wait with backoff on 503 (total ≤ OVERLOAD_WAIT_BUDGET_MS),
  // rotate immediately on 429 (per-project quota), and log every key's status.
  const statuses: Record<string, number | string> = {};
  let overloadWaitedMs = 0;
  let overloadStreak = 0;
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const keyIndex = (startIndex + i) % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
    if (overloadStreak > 0 && overloadWaitedMs < OVERLOAD_WAIT_BUDGET_MS) {
      const wait = Math.min(1000 * 2 ** (overloadStreak - 1), OVERLOAD_WAIT_BUDGET_MS - overloadWaitedMs);
      await new Promise((r) => setTimeout(r, wait));
      overloadWaitedMs += wait;
    }
    // Key in a header, never in the URL (it would land in proxy/access logs).
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

    try {
      const resp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 16384,
          },
        }),
      });

      statuses[`key${keyIndex + 1}`] = resp.status;
      if (resp.status === 503 || resp.status === 500) {
        overloadStreak++;
        await resp.body?.cancel();
        console.warn(`Gemini key ${keyIndex + 1}: ${resp.status} (Google overloaded), backing off`);
        continue;
      }
      overloadStreak = 0;
      if (resp.status === 429) {
        const errText = await resp.text();
        const quotaId = errText.match(/"quotaId":\s*"([^"]+)"/)?.[1] ?? "?";
        statuses[`key${keyIndex + 1}`] = `429:${quotaId}`;
        console.warn(`Gemini key ${keyIndex + 1}: 429 quota ${quotaId}, trying next`);
        continue;
      }

      if (!resp.ok) {
        const errText = await resp.text();
        // e.g. 403/404 when a NEW Google project has no access to gemini-2.5-flash
        console.error(`Gemini key ${keyIndex + 1} error ${resp.status}:`, errText.slice(0, 500));
        continue;
      }

      // D-1 fix (P3): one streaming decoder + line buffer across chunks.
      // P3 (DL-P13 item 5): when the request carries lesson params, the full text is
      // checked at the end and ONE extra event {"type":"validation",...} is sent.
      // Clients that do not know the event ignore it (no `choices`).
      const transformStream = createGeminiToOpenAiTransform(onComplete);

      return new Response(resp.body!.pipeThrough(transformStream), {
        headers: { ...cors, "Content-Type": "text/event-stream" },
      });

    } catch (err) {
      statuses[`key${keyIndex + 1}`] = "network";
      logError(`callGemini key ${keyIndex + 1}`, err);
      continue;
    }
  }

  // One structured line per failed request: which key got which answer (never the key itself).
  console.error(JSON.stringify({ ts: new Date().toISOString(), where: "callGemini", requestId, outcome: "ALL_KEYS_FAILED", keys: GEMINI_KEYS.length, overloadWaitedMs, statuses }));
  const summary: Record<string, number> = {};
  for (const v of Object.values(statuses)) {
    const k = String(v).split(":")[0];
    summary[k] = (summary[k] ?? 0) + 1;
  }
  return fail(cors, "ALL_KEYS_EXHAUSTED", { upstream: summary });
}

// ─── MAIN HANDLER (E-6) ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const cors = corsFor(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: cors["Access-Control-Allow-Origin"] ? 204 : 403, headers: cors });
  }
  if (req.method !== "POST") return fail(cors, "INVALID_INPUT");
  if (req.headers.get("Origin") && !cors["Access-Control-Allow-Origin"]) {
    return fail(cors, "FORBIDDEN_ORIGIN");
  }

  try {
    // 1. Authenticate — a signed-in Supabase user, never the anon key alone
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // Platform-provided; PUBLISHABLE_KEY is an optional fallback secret for projects
    // whose legacy anon key is disabled (custom secrets may not start with SUPABASE_).
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("PUBLISHABLE_KEY");
    if (!supabaseUrl || !anonKey) {
      logError("config", "SUPABASE_URL / SUPABASE_ANON_KEY missing");
      return fail(cors, "INTERNAL");
    }
    if (!token) return fail(cors, "UNAUTHORIZED");
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return fail(cors, "UNAUTHORIZED");

    // 2. Validate (before spending quota on a malformed request)
    // Size cap BEFORE parsing: Zod 3 can exhaust memory on oversized
    // collections (npm audit, 2026-11-06). Legit requests stay far below
    // (LIMITS.totalChars = 400 000 characters).
    const MAX_BODY_BYTES = 1_000_000;
    const declared = Number(req.headers.get("Content-Length") ?? "0");
    if (declared > MAX_BODY_BYTES) return fail(cors, "INVALID_INPUT");
    let body: unknown;
    try {
      const raw = await req.text();
      if (raw.length > MAX_BODY_BYTES) return fail(cors, "INVALID_INPUT");
      body = JSON.parse(raw);
    } catch {
      return fail(cors, "INVALID_INPUT");
    }
    const parsed = IblChatRequestSchema.safeParse(body);
    if (!parsed.success) return fail(cors, "INVALID_INPUT");

    // 3. Authorise — per-teacher AI quota (DL-P06: 30/day, 10/hour; admin exempt)
    const { data: quota, error: quotaError } = await supabase.rpc("consume_ai_quota");
    if (quotaError) {
      logError("consume_ai_quota", quotaError.message);
      return fail(cors, "INTERNAL");
    }
    const q = (quota ?? {}) as { allowed?: boolean; reason?: string; retry_after_s?: number };
    if (q.reason === "UNAUTHORIZED") return fail(cors, "UNAUTHORIZED");
    if (!q.allowed) {
      return fail(cors, "AI_QUOTA_EXCEEDED", { reason: q.reason, retry_after_s: q.retry_after_s });
    }

    // 4. Execute — unchanged generation logic
    const requestId = crypto.randomUUID();

    const aiMessages = buildProductionMessages(parsed.data); // PRODUCTION_PSI in _shared/prompt.ts

    // 5. Return (stream)
    const p = parsed.data.params;
    const onComplete = p
      ? (fullText: string): string | null => {
        try {
          const report = validatePlan(fullText, { language: p.language, duration_min: p.duration_min, tier: p.tier });
          return JSON.stringify({ type: "validation", report });
        } catch (e) {
          logError("validatePlan", e); // never break the stream because of the check
          return null;
        }
      }
      : undefined;
    return await callGemini(aiMessages, requestId, cors, onComplete);

  } catch (e) {
    logError("handler", e);
    return fail(cors, "INTERNAL");
  }
});
