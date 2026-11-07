// Gemini SSE -> OpenAI-style SSE (the format the browser's useChat reads).
//
// P3 / D-1 fix: network chunks can split an SSE line, and can split a
// multi-byte UTF-8 character (č ć š ž đ ä ö ü ß). The pre-P3 code decoded
// every chunk separately and dropped any line that didn't parse, which
// silently lost text or garbled letters. This version keeps ONE streaming
// decoder and a line buffer across chunks, and flushes the remainder at the end.

const encoder = new TextEncoder();

function emit(controller: TransformStreamDefaultController<Uint8Array>, line: string): void {
  if (!line.startsWith("data: ")) return;
  const jsonStr = line.slice(6).trim();
  if (!jsonStr || jsonStr === "[DONE]") return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // A complete line that is not JSON is not recoverable; log, don't hide.
    console.error(JSON.stringify({ ts: new Date().toISOString(), where: "sse.emit", message: "unparseable SSE line", length: jsonStr.length }));
    return;
  }
  const parts = (parsed as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
    ?.candidates?.[0]?.content?.parts ?? [];
  // Gemini may return several text parts in one event; the old code kept only parts[0].
  const content = parts.map((p) => p?.text ?? "").join("");
  if (!content) return;
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: null }] })}\n\n`));
}

export function createGeminiToOpenAiTransform(
  onComplete?: (fullText: string) => string | null,
): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let full = "";
  const capture = (controller: TransformStreamDefaultController<Uint8Array>, line: string) => {
    // keep the full text for onComplete (validation)
    if (line.startsWith("data: ")) {
      try {
        const parsed = JSON.parse(line.slice(6).trim());
        const parts = parsed?.candidates?.[0]?.content?.parts ?? [];
        full += parts.map((p: { text?: string }) => p?.text ?? "").join("");
      } catch { /* handled in emit */ }
    }
    emit(controller, line);
  };
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        capture(controller, line);
      }
    },
    flush(controller) {
      buffer += decoder.decode();
      for (let line of buffer.split("\n")) {
        if (line.endsWith("\r")) line = line.slice(0, -1);
        capture(controller, line);
      }
      const extra = onComplete ? onComplete(full) : null;
      if (extra) controller.enqueue(encoder.encode(`data: ${extra}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    },
  });
}
