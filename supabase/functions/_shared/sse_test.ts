// deno test supabase/functions/_shared/sse_test.ts
import { createGeminiToOpenAiTransform } from "./sse.ts";

function geminiEvent(text: string): string {
  return `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;
}

async function run(bytes: Uint8Array, cuts: number[], onComplete?: (t: string) => string | null): Promise<{ text: string; raw: string }> {
  const chunks: Uint8Array[] = [];
  let prev = 0;
  for (const c of [...cuts, bytes.length]) { chunks.push(bytes.slice(prev, c)); prev = c; }
  const src = new ReadableStream<Uint8Array>({ start(ctrl) { for (const ch of chunks) ctrl.enqueue(ch); ctrl.close(); } });
  const out = src.pipeThrough(createGeminiToOpenAiTransform(onComplete));
  const raw = await new Response(out).text();
  let text = "";
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
    const p = JSON.parse(line.slice(6));
    text += p.choices?.[0]?.delta?.content ?? "";
  }
  return { text, raw };
}

const SAMPLE = ["ISTRAŽIVAČKO PITANJE: ", "Zašto čovjek ", "šuti? Größe ", "über alles — đak."];
const BYTES = new TextEncoder().encode(SAMPLE.map(geminiEvent).join(""));
const EXPECTED = SAMPLE.join("");

Deno.test("no split: full text", async () => {
  const { text } = await run(BYTES, []);
  if (text !== EXPECTED) throw new Error(text);
});

Deno.test("every possible single split point keeps text and diacritics intact", async () => {
  for (let cut = 1; cut < BYTES.length; cut++) {
    const { text } = await run(BYTES, [cut]);
    if (text !== EXPECTED) throw new Error(`cut at ${cut}: ${JSON.stringify(text)}`);
  }
});

Deno.test("byte-by-byte delivery", async () => {
  const cuts = Array.from({ length: BYTES.length - 1 }, (_, i) => i + 1);
  const { text } = await run(BYTES, cuts);
  if (text !== EXPECTED) throw new Error(text);
});

Deno.test("multiple parts in one event are all kept", async () => {
  const ev = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "A" }, { text: "B" }] } }] })}\n\n`;
  const { text } = await run(new TextEncoder().encode(ev), []);
  if (text !== "AB") throw new Error(text);
});

Deno.test("onComplete receives the full text and its event is sent before [DONE]", async () => {
  let seen = "";
  const { raw } = await run(BYTES, [7, 40], (t) => { seen = t; return JSON.stringify({ validation: { passed: 1, total: 1, failed: [] } }); });
  if (seen !== EXPECTED) throw new Error(seen);
  const iv = raw.indexOf('"validation"'), id = raw.indexOf("[DONE]");
  if (iv < 0 || iv > id) throw new Error("validation event missing or after DONE");
});

Deno.test("missing trailing newline at end of stream is flushed", async () => {
  const b = new TextEncoder().encode(geminiEvent("kraj").trimEnd());
  const { text } = await run(b, []);
  if (text !== "kraj") throw new Error(text);
});
