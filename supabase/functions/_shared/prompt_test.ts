// deno test --allow-read supabase/functions/_shared/prompt_test.ts
import { buildMessages, buildProductionMessages, PRODUCTION_PSI } from "./prompt.ts";
import { PSI_V90_PROMPT } from "./psi_v90.generated.ts";
import { IblChatRequestSchema } from "../../../src/lib/validation/schemas.ts";

const params = { subject: "Biologie", grade: 5, topic: "Fotosinteza", duration_min: 45, language: "bosnian", tier: "MICRO" };
const gen = IblChatRequestSchema.parse({ mode: "generate", messages: [{ role: "user", content: "x" }], plan_context: null, params });
const PLAN = "PLANER ZA IBL LEKCIJU\nISTRAŽIVAČKO PITANJE\nZašto?";
const chat = IblChatRequestSchema.parse({
  mode: "chat",
  messages: [{ role: "model", content: PLAN }, { role: "user", content: "Popravi udicu." }],
  plan_context: PLAN,
  params,
});

Deno.test("production uses PSI v9.1 — approved by the Director on 2026-11-13 (DL-P20)", () => {
  // Changing this value changes what every teacher gets; it needs the Director's approval.
  if (PRODUCTION_PSI !== "v91") throw new Error(`PRODUCTION_PSI is ${PRODUCTION_PSI}; the approved production prompt is v91`);
  for (const req of [gen, chat]) {
    if (JSON.stringify(buildProductionMessages(req)) !== JSON.stringify(buildProductionMessages(req, "v91"))) throw new Error("default differs from v91");
  }
});

Deno.test("rollback path: v81 is still byte-identical to the pre-P3 prompt builder", () => {
  for (const req of [gen, chat]) {
    if (JSON.stringify(buildProductionMessages(req, "v81")) !== JSON.stringify(buildMessages(req, "v81"))) throw new Error("v81 rollback differs");
  }
});

Deno.test("switched to v90: the system instruction is exactly the generated PSI v9 text", () => {
  const m = buildProductionMessages(gen, "v90");
  if (m[0].role !== "system" || m[0].content !== PSI_V90_PROMPT) throw new Error("system prompt is not PSI v9");
  if (!m[1].content.startsWith("MODE B")) throw new Error("generate must use the MODE B wrapper");
  if (!m[1].content.includes("output_language: Bosnian")) throw new Error(m[1].content);
});

Deno.test("switched to v90: chat sends the plan exactly once (audit D-6)", () => {
  const m = buildProductionMessages(chat, "v90");
  const count = m.filter((x) => x.content.includes(PLAN)).length;
  if (count !== 1) throw new Error(`plan sent ${count} times`);
  if (m[m.length - 1].content !== "Popravi udicu.") throw new Error("last message must be the teacher's request");
});

Deno.test("PSI v9.1 is live with its lesson-flow checks (P4, DL-P20)", async () => {
  const { PSI_V91_PROMPT } = await import("./psi_v91.generated.ts");
  const { pedagogyChecksFor } = await import("./prompt.ts");
  if (buildProductionMessages(gen, "v91")[0].content !== PSI_V91_PROMPT) throw new Error("v91 not wired");
  if (!PSI_V91_PROMPT.includes("A16") || !PSI_V91_PROMPT.includes("TOK ČASA")) throw new Error("v91 lacks A16");
  if (!pedagogyChecksFor(PRODUCTION_PSI)) throw new Error("the A16 checks must be on in production with v91");
  if (pedagogyChecksFor("v90")) throw new Error("v9.0 plans (rollback) must not be judged by A16 rules");
});
