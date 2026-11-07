// supabase/functions/ibl-chat — AI lesson-plan generation (Gemini, streamed SSE)
//
// P1 (2026-11-06, Commander E-6): authenticate -> authorise (AI quota)
// -> validate (Zod, shared with the browser) -> execute -> return.
// Generation logic, the PSI prompt and the stream format are UNCHANGED
// from the pre-P1 version (prompt/AI changes are P3). Stream decoding fixed in P3 (_shared/sse.ts).
//
// Required Edge Function secrets: GEMINI_KEY_1..GEMINI_KEY_8 (at least one),
// ALLOWED_ORIGINS (comma-separated, e.g. https://ibl-lesson-planner.vercel.app).
// Provided by the Supabase platform: SUPABASE_URL, SUPABASE_ANON_KEY
// (optional fallback secret: PUBLISHABLE_KEY).

import { createClient } from "@supabase/supabase-js";
import { IblChatRequestSchema } from "../../../src/lib/validation/schemas.ts";
import { createGeminiToOpenAiTransform } from "../_shared/sse.ts";
import { buildMessages } from "../_shared/prompt.ts";
import { PSI_V81_PROMPT } from "../_shared/psi_v81.ts";

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
  ALL_KEYS_EXHAUSTED: { status: 429, message: "Svi API ključevi su privremeno preopterećeni. Sačekajte 1 minutu." },
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
const GEMINI_KEYS: string[] = [];
for (let i = 1; i <= 8; i++) {
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
): Promise<Response> {
  if (GEMINI_KEYS.length === 0) {
    logError("callGemini", "No Gemini API keys configured (GEMINI_KEY_1..8)");
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

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const keyIndex = (startIndex + i) % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
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

      if (resp.status === 429 || resp.status === 503) {
        console.warn(`Gemini key ${keyIndex + 1} rate limited, trying next...`);
        continue;
      }

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`Gemini key ${keyIndex + 1} error ${resp.status}:`, errText);
        continue;
      }

      // D-1 fix (P3): one streaming decoder + line buffer across chunks.
      const transformStream = createGeminiToOpenAiTransform();

      return new Response(resp.body!.pipeThrough(transformStream), {
        headers: { ...cors, "Content-Type": "text/event-stream" },
      });

    } catch (err) {
      logError(`callGemini key ${keyIndex + 1}`, err);
      continue;
    }
  }

  return fail(cors, "ALL_KEYS_EXHAUSTED");
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

    const aiMessages = buildMessages(parsed.data, "v81");

    // 5. Return (stream)
    return await callGemini(aiMessages, requestId, cors);

  } catch (e) {
    logError("handler", e);
    return fail(cors, "INTERNAL");
  }
});
